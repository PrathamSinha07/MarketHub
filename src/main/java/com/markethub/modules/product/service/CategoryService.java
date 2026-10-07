package com.markethub.modules.product.service;

import com.markethub.modules.product.dto.CategoryRequest;
import com.markethub.modules.product.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryRequest request);

    CategoryResponse getCategoryById(Long categoryId);

    List<CategoryResponse> getRootCategories();

    CategoryResponse updateCategory(Long categoryId, CategoryRequest request);

    void deleteCategory(Long categoryId);

    List<CategoryResponse> getSubCategories(Long parentId);
}
