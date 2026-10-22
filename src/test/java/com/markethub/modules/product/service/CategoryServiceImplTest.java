package com.markethub.modules.product.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.product.dto.CategoryRequest;
import com.markethub.modules.product.entity.Category;
import com.markethub.modules.product.repository.CategoryRepository;
import com.markethub.modules.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category category(long id, Category parent) {
        Category c = Category.builder().name("Cat " + id).slug("cat-" + id).parent(parent)
                .subCategories(new ArrayList<>()).build();
        c.setId(id);
        return c;
    }

    // ------------------------------------------------------------- deletion

    @Test
    void deleteCategory_withSubCategories_conflicts() {
        Category parent = category(1L, null);
        parent.getSubCategories().add(category(2L, parent));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(parent));

        ApiException ex = assertThrows(ApiException.class, () -> categoryService.deleteCategory(1L));

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(categoryRepository, never()).delete(parent);
    }

    @Test
    void deleteCategory_withProducts_conflicts() {
        Category category = category(1L, null);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.existsByCategoryId(1L)).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class, () -> categoryService.deleteCategory(1L));

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, ex.getStatus());
        verify(categoryRepository, never()).delete(category);
    }

    @Test
    void deleteCategory_unused_deletes() {
        Category category = category(1L, null);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.existsByCategoryId(1L)).thenReturn(false);

        categoryService.deleteCategory(1L);

        verify(categoryRepository).delete(category);
    }

    @Test
    void deleteCategory_unknownId_throwsNotFound() {
        when(categoryRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteCategory(9L));
    }

    // ---------------------------------------------------------- parent/cycle

    @Test
    void updateCategory_selfParent_rejected() {
        Category category = category(1L, null);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        ApiException ex = assertThrows(ApiException.class,
                () -> categoryService.updateCategory(1L, new CategoryRequest("Cat 1", "cat-1", 1L)));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void updateCategory_parentCycle_rejected() {
        // A (1) -> parent B (2); making B a child of A would create a loop.
        Category a = category(1L, null);
        Category b = category(2L, a);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(a));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(b));

        ApiException ex = assertThrows(ApiException.class,
                () -> categoryService.updateCategory(1L, new CategoryRequest("Cat 1", "cat-1", 2L)));

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void updateCategory_validParent_applies() {
        Category a = category(1L, null);
        Category b = category(2L, null);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(a));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(b));
        when(categoryRepository.save(a)).thenReturn(a);

        categoryService.updateCategory(1L, new CategoryRequest("Renamed", "renamed", 2L));

        assertEquals("Renamed", a.getName());
        assertEquals(2L, a.getParent().getId());
    }

    @Test
    void createCategory_unknownParent_throwsNotFound() {
        when(categoryRepository.findById(42L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> categoryService.createCategory(new CategoryRequest("New", "new", 42L)));
    }
}
