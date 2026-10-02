package com.markethub.modules.product.dto;

import java.util.List;

public class CategoryResponse {

    private Long id;
    private String name;
    private String slug;
    private Long parentId;
    private List<CategoryResponse> subCategories;

    public CategoryResponse() {
    }

    public CategoryResponse(Long id, String name, String slug, Long parentId, List<CategoryResponse> subCategories) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.parentId = parentId;
        this.subCategories = subCategories;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public List<CategoryResponse> getSubCategories() {
        return subCategories;
    }

    public void setSubCategories(List<CategoryResponse> subCategories) {
        this.subCategories = subCategories;
    }
}
