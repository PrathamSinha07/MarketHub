package com.markethub.modules.product.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.product.dto.CategoryRequest;
import com.markethub.modules.product.dto.CategoryResponse;
import com.markethub.modules.product.entity.Category;
import com.markethub.modules.product.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
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
        return categoryRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", parentId));
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
