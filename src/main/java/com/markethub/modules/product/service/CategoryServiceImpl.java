package com.markethub.modules.product.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.product.dto.CategoryRequest;
import com.markethub.modules.product.dto.CategoryResponse;
import com.markethub.modules.product.entity.Category;
import com.markethub.modules.product.repository.CategoryRepository;
import com.markethub.modules.product.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category parent = resolveParent(request.getParentId(), null);

        Category category = Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .parent(parent)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return toResponse(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long categoryId) {
        Category category = getCategory(categoryId);
        return toResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long categoryId, CategoryRequest request) {
        Category category = getCategory(categoryId);
        Category parent = resolveParent(request.getParentId(), categoryId);

        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setParent(parent);

        Category updatedCategory = categoryRepository.save(category);
        return toResponse(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId) {
        Category category = getCategory(categoryId);

        // Deleting a parent category would either cascade-delete its children
        // or trip a foreign-key error mid-delete (a 500). Refuse cleanly while
        // the category is still referenced by subcategories or products.
        if (!category.getSubCategories().isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete a category that still has subcategories");
        }
        if (productRepository.existsByCategoryId(categoryId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot delete a category that still has products");
        }
        categoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getSubCategories(Long parentId) {
        Category parent = getCategory(parentId);
        return parent.getSubCategories().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Category getCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
    }

    private Category resolveParent(Long parentId, Long currentCategoryId) {
        if (parentId == null) {
            return null;
        }
        if (currentCategoryId != null && currentCategoryId.equals(parentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A category cannot be its own parent");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", parentId));

        // Reject parent choices that would create a cycle (A -> B followed by
        // B -> A): walk up the proposed parent's ancestry; if the category being
        // edited appears in it, the new hierarchy would loop forever.
        if (currentCategoryId != null) {
            Set<Long> seen = new HashSet<>();
            Category cursor = parent;
            while (cursor != null) {
                if (currentCategoryId.equals(cursor.getId())) {
                    throw new ApiException(HttpStatus.BAD_REQUEST,
                            "Category hierarchy cannot contain a cycle");
                }
                if (!seen.add(cursor.getId())) {
                    // Pre-existing cycle in the data - refuse rather than loop.
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Category hierarchy is corrupted and must be repaired first");
                }
                cursor = cursor.getParent();
            }
        }
        return parent;
    }

    private CategoryResponse toResponse(Category category) {
        Long parentId = category.getParent() != null ? category.getParent().getId() : null;
        List<CategoryResponse> subCategories = category.getSubCategories().stream()
                .map(sub -> new CategoryResponse(sub.getId(), sub.getName(), sub.getSlug(),
                        sub.getParent() != null ? sub.getParent().getId() : null, null))
                .collect(Collectors.toList());
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug(), parentId, subCategories);
    }
}
