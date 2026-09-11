<template>
  <div class="tag-manager">
    <!-- 顶部工具栏 -->
    <div class="toolbar" :class="{ 'toolbar-collapsed': isToolbarCollapsed }">
      <!-- 工具栏折叠条：整条可点击 -->
      <div class="toolbar-collapse-bar" @click="toggleToolbarCollapse"
        :title="isToolbarCollapsed ? '展开工具栏' : '折叠工具栏'">
        <svg viewBox="0 0 24 24" width="12" height="12" class="toolbar-collapse-arrow"
          :class="{ rotated: isToolbarCollapsed }">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
        </svg>
        <span>{{ isToolbarCollapsed ? '展开工具栏' : '折叠工具栏' }}</span>
      </div>
      <div class="toolbar-top" v-show="!isToolbarCollapsed">
        <!-- 左侧：搜索区，全局搜索在上、本组过滤在下 -->
        <div class="toolbar-search-stack">
          <div class="search-container" :class="{ 'search-active': isSearching }">
            <input type="text" v-model="searchQuery" :placeholder="t('tagManager.searchPlaceholder')"
              class="search-input" ref="searchInput" :title="t('tagManager.globalSearchTip')"
              @keydown="handleSearchKeydown" />
            <div v-if="isSearching" class="search-results" :style="searchResultsStyle" ref="searchResultsListRef">
              <div v-if="searchResults.length === 0" class="no-results">
                {{ t('tagManager.noResults') }}
              </div>
              <div v-else v-for="(result, index) in searchResults" :key="`${index}-search_item`"
                class="search-result-item" :class="{ selected: index === searchResultIndex }"
                @mouseenter="searchResultIndex = index" @click="navigateToResult(result)">
                <div class="result-content">
                  <span class="result-text">
                    {{ result.name || result.text }}
                  </span>
                  <span class="result-path">
                    {{ result.where }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="search-container" :class="{ 'search-active': isFilterSearching }">
            <input type="text" v-model="tagSearchKeyword" @input="setTagPage(1)"
              :placeholder="t('tagManager.filterPlaceholder')" class="search-input"
              ref="filterSearchInput" :title="t('tagManager.filterCurrentTip')"
              @keydown="handleFilterKeydown" />
            <div v-if="isFilterSearching" class="search-results" :style="filterResultsStyle" ref="filterSuggestionsListRef">
              <div v-if="filterSuggestions.length === 0" class="no-results">
                {{ t('tagManager.noResults') }}
              </div>
              <div v-else v-for="(s, index) in filterSuggestions" :key="`filter-${index}-${s.id_index}`"
                class="search-result-item" :class="{ selected: index === filterSuggestionIndex }"
                @mouseenter="filterSuggestionIndex = index" @click="navigateToLocalTag(s)">
                <div class="result-content">
                  <span class="result-text">
                    {{ s.desc }}
                  </span>
                  <span class="result-path">
                    {{ s.text }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：全部工具栏按钮，两行右对齐（宽度接近、右缘对齐） -->
        <div class="toolbar-actions">
          <div class="toolbar-actions-row">
            <button class="refresh-btn" @click="refreshTags" title="刷新">
              <svg viewBox="0 0 24 24" width="16" height="16" class="refresh-icon">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </button>

            <button class="import-btn" @click="showImportDialog">
              {{ t('tagManager.importTags') }}
            </button>

            <label class="group-edit-mode">
              <input type="checkbox" v-model="isAutoAddSearchTag" :true-value="1" :false-value="0" />
              {{ t('tagManager.autoAddSearchTag') }}
            </label>
          </div>

          <div class="toolbar-actions-row">
            <button class="tab-size-btn" @click="showTabSizeDialog">
              {{ t('tagManager.modifyTabSize') }}
            </button>
            <button class="add-btn" @click="showAddTagDialog" :disabled="!selectedGroup">
              <span class="plus-icon">+</span>
              {{ t('tagManager.addTag') }}
            </button>

            <button v-if="isShareTagAction" class="share-selected-btn" @click="shareSelectedTags"
              :disabled="!selectedTags.length">
              {{ t('tagManager.shareSelected') }}
            </button>
            <button v-else class="share-btn" @click="shareTagAction" :disabled="!selectedGroup">
              {{ t('tagManager.batchShare') }}
            </button>
            <button v-if="isShareTagAction" class="cancel-delete-btn" @click="cancelShareAction">
              {{ t('tagManager.cancelShare') }}
            </button>

            <button v-if="isDeleteTagAction" class="delete-btn" @click="deleteSelectedTags"
              :disabled="!selectedTags.length">
              {{ t('tagManager.deleteSelected') }}
            </button>
            <button v-else class="delete-action-btn" @click="deleteTagAction" :disabled="!selectedGroup">
              {{ t('tagManager.hasDeleteAction') }}
            </button>
            <button v-if="isDeleteTagAction" class="cancel-delete-btn" @click="cancelDeleteAction">
              {{ t('tagManager.cancelDelete') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类导航区域 -->
    <div class="category-tabs">
      <!-- 一级分类 tabs -->
      <div class="tabs-wrapper primary-tabs">
        <div class="tabs-scroll">
          <div v-for="(category, index) in categories" :key="'Tabss-' + index" class="tab-item"
            :class="{ active: selectedCategory?.name === category.name }" :style="{
              backgroundColor: selectedCategory?.name === category.name ? 'var(--primary-color)' : category.color,
              color: selectedCategory?.name === category.name ? '#ffffff' : getContrastColor(category.color),
              width: tabSizeConfig.primaryTab.width === 'fit-content' ? 'fit-content' : tabSizeConfig.primaryTab.width + 'px',
              height: tabSizeConfig.primaryTab.height + 'px',
              fontSize: tabSizeConfig.primaryTab.fontSize + 'px'
            }" @click="selectCategory(category)" @mouseenter="showTabActions(index)"
            @mouseleave="hideTabActions(index)">
            <span class="tab-text">{{ category.name }}</span>
            <div class="tab-actions" v-if="hoverTabsActionFrist == 'TabID-' + index">
              <button class="action-btn move" @click.stop="openMoveGroupDialog(category, 1)"
                :title="t('tagManager.moveGroup')">
                <svg viewBox="0 0 24 24" class="move-icon">
                  <path d="M13 6v3h8V6h-8zm0 5v3h8v-3h-8zm-8 5v3h8v-3H5zm0-5v3h8v-3H5zm0-5v3h8V6H5z" />
                </svg>
              </button>
              <button class="action-btn edit" @click.stop="editCategory(category)" :title="t('tagManager.edit')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
              <button class="action-btn share" @click.stop="shareCategory(category)" :title="t('tagManager.share')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path
                    d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="deleteCategory(category)" :title="t('tagManager.delete')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          </div>
          <button class="add-tab" @click="showAddCategoryDialog('primary')">
            <span class="plus-icon">+</span>
            {{ t('tagManager.addPrimaryCategory') }}
          </button>

          <div class="group-edit-mode">
            <label>
              <input type="checkbox" v-model="editGroupCategroy" :true-value="1" :false-value="0" />
              {{ editGroupCategroy == 1 ? t('tagManager.exitEditMode') : t('tagManager.editGroupMode') }}
            </label>
          </div>

        </div>
      </div>

      <!-- 二级分类 分组 tabs -->
      <div class="tabs-wrapper group-tabs" v-if="selectedCategory">
        <div class="tabs-scroll">
          <div v-for="(group, index) in subCategories" :key="'TabsSw-' + index" class="tab-item"
            :class="{ active: selectedGroup?.name === group.name, 'drag-over-group': dragOverGroupId === group.id_index }"
            :data-group-id="group.id_index" :data-group-uuid="group.g_uuid"
            :style="{
              backgroundColor: selectedGroup?.name === group.name ? 'var(--primary-color)' : group.color,
              color: selectedGroup?.name === group.name ? '#ffffff' : getContrastColor(group.color),
              width: tabSizeConfig.groupTab.width === 'fit-content' ? 'fit-content' : tabSizeConfig.groupTab.width + 'px',
              height: tabSizeConfig.groupTab.height + 'px',
              fontSize: tabSizeConfig.groupTab.fontSize + 'px'
            }" @click="selectGroup(group)" @mouseenter="showTabActionsGroup(index)"
            @mouseleave="hideTabActionsGroup(index)">
            <span class="tab-text">{{ group.name }}</span>
            <div class="tab-actions" v-if="hoverTabsActionSecond == 'TabID-' + index">
              <button class="action-btn move" @click.stop="openMoveGroupDialog(group, 2)"
                :title="t('tagManager.moveGroup')">
                <svg viewBox="0 0 24 24" class="move-icon">
                  <path d="M13 6v3h8V6h-8zm0 5v3h8v-3h-8zm-8 5v3h8v-3H5zm0-5v3h8v-3H5zm0-5v3h8V6H5z" />
                </svg>
              </button>
              <button class="action-btn edit" @click.stop="editGroup(group)" :title="t('tagManager.edit')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="deleteGroup(group)" :title="t('tagManager.delete')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
              <button class="action-btn share" @click.stop="shareCategorySecond(group)" :title="t('tagManager.share')">
                <svg viewBox="0 0 24 24" class="action-icon">
                  <path
                    d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </button>
            </div>
          </div>
          <button class="add-tab" v-if="selectedCategory" @click="showAddCategoryDialog('group')">
            <span class="plus-icon">+</span>
            {{ t('tagManager.addGroup') }}
          </button>
          <div class="group-edit-mode">
            <label>
              <input type="checkbox" v-model="editGroupTabs" :true-value="1" :false-value="0" />
              {{ editGroupTabs == 1 ? t('tagManager.exitEditMode') : t('tagManager.editGroupMode') }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Tag列表 标签内容区域 -->
    <div class="tags-content">


      <!-- 标签过滤与分页工具条 -->
      <div class="tags-toolbar" v-if="selectedGroup && currentTags.length > 0">
        <div class="tag-pagination" v-if="tagTotalPages > 1">
          <span class="tag-page-info">{{ filteredTags.length }}</span>
          <button class="tag-page-btn" @click="setTagPage(tagPage - 1)" :disabled="tagPage <= 1">‹</button>
          <span class="tag-page-info">{{ tagPage }} / {{ tagTotalPages }}</span>
          <button class="tag-page-btn" @click="setTagPage(tagPage + 1)" :disabled="tagPage >= tagTotalPages">›</button>
        </div>
      </div>

      <div class="tags-grid" v-if="selectedGroup" ref="tagsGridRef">
        <div v-for="tag in pagedTags" :key="'tag-grid-' + tag.id_index"
          :class="[highlightedTagId === tag.id_index ? 'tag-wrapper highlight' : 'tag-wrapper', {
            'dragging': dragTagId === tag.id_index
          }]"
          :data-tag-id="tag.id_index">
          <div class="tag-content" @click="handleTagClick(tag)">
            <div class="tag-main" :style="{ backgroundColor: tag.color || 'transparent' }">
              {{ tag.desc }}
              <div class="tag-actions">
                <button class="action-btn move" @mousedown.stop="handleTagMouseDown($event, tag)"
                  @click.stop="handleMoveBtnClick(tag)" :title="t('tagManager.moveTag')">
                  <svg viewBox="0 0 24 24" class="move-icon">
                    <path d="M13 6v3h8V6h-8zm0 5v3h8v-3h-8zm-8 5v3h8v-3H5zm0-5v3h8v-3H5zm0-5v3h8V6H5z" />
                  </svg>
                </button>
                <button class="action-btn edit" @click.stop="editTag(tag)" :title="t('tagManager.editTag')">
                  <svg viewBox="0 0 24 24" class="edit-icon">
                    <path
                      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button class="action-btn delete" @click.stop="deleteTag(tag)" :title="t('tagManager.deleteTag')">
                  <svg viewBox="0 0 24 24" class="delete-icon">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="tag-desc">{{ tag.text }}</div>
          </div>
          <input v-if="isSelectTagAction" type="checkbox" v-model="selectedTags" :value="tag"
            class="tag-checkbox" />
        </div>
        <!-- 拖拽插入位置指示线（与提示词输入框一致，居中显示在标签之间的空隙里） -->
        <div v-show="dropIndicator.show" class="drop-indicator"
          :style="{ left: dropIndicator.x + 'px', top: dropIndicator.y + 'px', height: dropIndicator.height + 'px' }"></div>
      </div>
    </div>

    <!-- 分类对话框 -->
    <div v-if="showCategoryDialog" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content" @mousedown.stop>
        <div class="weilin-tools-dialog-header">
          <h2>{{ getCategoryDialogTitle() }}</h2>
          <button class="close-btn" @click="closeCategoryDialog">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <div class="form-group" v-if="categoryType == 'primary'">
            <label>{{ t('tagManager.categoryName') }}</label>
            <input type="text" v-model="currentCategory.name" :placeholder="t('tagManager.categoryNamePlaceholder')"
              @keyup.enter="saveCategory">
          </div>
          <div class="form-group" v-if="categoryType == 'group'">
            <label>{{ t('tagManager.groupName') }}</label>
            <input type="text" v-model="currentGroup.name" :placeholder="t('tagManager.groupNamePlaceholder')"
              @keyup.enter="saveCategory">
          </div>
          <div class="form-group">
            <label>{{ t('tagManager.backgroundColor') }}</label>
            <div class="color-picker">
              <div class="color-preview" :style="{ backgroundColor: previewColor }">
              </div>
              <div class="color-controls">
                <input type="color" v-model="colorPickerState.hex" @input="updateColor" class="color-input">
                <div class="alpha-control">
                  <input type="range" v-model.number="colorPickerState.alpha" min="0" max="100" @input="updateColor"
                    class="alpha-slider">
                  <span class="alpha-value">{{ colorPickerState.alpha }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="cancel-btn" @click="closeCategoryDialog">{{ t('common.cancel') }}</button>
          <button class="confirm-btn" @click="saveCategory">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 标签对话框 -->
    <div v-if="showTagDialog" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content" @mousedown.stop>
        <div class="weilin-tools-dialog-header">
          <h2>{{ isEditingTag ? t('tagManager.editTag') : t('tagManager.addTag') }}</h2>
          <button class="close-btn" @click="closeTagDialog">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <div class="form-group">
            <label>{{ t('tagManager.text') }}</label>
            <input type="text" v-model="currentTag.desc" :placeholder="t('tagManager.textPlaceholder')">
          </div>
          <div class="form-group">
            <label>{{ t('tagManager.description') }}</label>
            <textarea v-model="currentTag.text" :placeholder="t('tagManager.descriptionPlaceholder')" rows="4">
            </textarea>
          </div>
          <div class="form-group">
            <label>{{ t('tagManager.backgroundColor') }}</label>
            <div class="color-picker">
              <div class="color-preview" :style="{ backgroundColor: previewColor }">
              </div>
              <div class="color-controls">
                <input type="color" v-model="colorPickerState.hex" @input="updateColor" class="color-input">
                <div class="alpha-control">
                  <input type="range" v-model.number="colorPickerState.alpha" min="0" max="100" @input="updateColor"
                    class="alpha-slider">
                  <span class="alpha-value">{{ colorPickerState.alpha }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="cancel-btn" @click="closeTagDialog">{{ t('common.cancel') }}</button>
          <button class="confirm-btn" @click="saveTag">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 确认删除对话框 -->
    <div v-if="showDeleteDialog" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content confirm-weilin-tools-dialog" @mousedown.stop>
        <div class="weilin-tools-dialog-header">
          <h2>{{ t('common.confirmDelete') }}</h2>
          <button class="close-btn" @click="closeDeleteDialog">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <p class="confirm-message">{{ deleteConfirmMessage }}</p>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="cancel-btn" @click="closeDeleteDialog">{{ t('common.cancel') }}</button>
          <button class="delete-btn" @click="confirmDelete">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- 移动标签对话框 -->
    <div v-if="showMoveDialog" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content">
        <div class="weilin-tools-dialog-header">
          <h2>{{ t('tagManager.moveTag') }}</h2>
          <button class="close-btn" @click="showMoveDialog = false">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <div class="form-group">
            <label>{{ t('tagManager.targetTag') }}</label>
            <select v-model="moveTargetTagId" class="form-select">
              <option v-for="tag in currentTags" :key="tag.id_index" :value="tag.id_index">
                {{ tag.desc + ' --> ' + tag.text }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('tagManager.movePosition') }}</label>
            <div class="radio-group">
              <label>
                <input class="radio-input" type="radio" v-model="movePosition" value="before" />
                {{ t('tagManager.moveBefore') }}
              </label>
              <label>
                <input class="radio-input" type="radio" v-model="movePosition" value="after" />
                {{ t('tagManager.moveAfter') }}
              </label>
            </div>
          </div>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="cancel-btn" @click="showMoveDialog = false">{{ t('common.cancel') }}</button>
          <button class="confirm-btn" @click="confirmMove">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>


    <!-- 移动分组对话框 -->
    <div v-if="showMoveGroupDialog" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content">
        <div class="weilin-tools-dialog-header">
          <h2>{{ t('tagManager.moveGroup') }}</h2>
          <button class="close-btn" @click="showMoveGroupDialog = false">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <div class="form-group">
            <label>{{ t('tagManager.targetGroup') }}</label>
            <select v-model="moveTargetGroupId" class="form-select">
              <option v-for="(item, index) in availableGroup" :key="'group_move_id' + index" :value="item.id_index">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('tagManager.movePosition') }}</label>
            <div class="radio-group">
              <label>
                <input class="radio-input" type="radio" v-model="moveGroupPosition" value="before" />
                {{ t('tagManager.moveGroupBefore') }}
              </label>
              <label>
                <input class="radio-input" type="radio" v-model="moveGroupPosition" value="after" />
                {{ t('tagManager.moveGroupAfter') }}
              </label>
            </div>
          </div>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="cancel-btn" @click="showMoveGroupDialog = false">{{ t('common.cancel') }}</button>
          <button class="confirm-btn" @click="confirmMoveGroup">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 标签尺寸配置对话框 -->
    <div v-if="showTabSizeConfig" class="weilin-tools-dialog-overlay">
      <div class="weilin-tools-dialog-content tab-size-weilin-tools-dialog" @mousedown.stop>
        <div class="weilin-tools-dialog-header">
          <h2>{{ t('tagManager.tabSizeConfig') }}</h2>
          <button class="close-btn" @click="closeTabSizeDialog">×</button>
        </div>
        <div class="weilin-tools-dialog-body">
          <!-- 一级分类配置 -->
          <div class="config-section">
            <h3>{{ t('tagManager.primaryTabConfig') }}</h3>
            <div class="form-group">
              <label>{{ t('tagManager.tabWidth') }}</label>
              <div class="width-control">
                <label class="radio-label">
                  <input type="radio" v-model="tabSizeConfig.primaryTab.width" value="fit-content" />
                  {{ t('tagManager.fitContent') }}
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="tabSizeConfig.primaryTab.width" value="custom" />
                  {{ t('tagManager.customWidth') }}
                </label>
                <input v-if="tabSizeConfig.primaryTab.width !== 'fit-content'" type="number"
                  v-model.number="tabSizeConfig.primaryTab.width" min="50" max="300" class="number-input" />
              </div>
            </div>
            <div class="form-group">
              <label>{{ t('tagManager.tabHeight') }} ({{ tabSizeConfig.primaryTab.height }}px)</label>
              <input type="range" v-model.number="tabSizeConfig.primaryTab.height" min="20" max="60"
                class="range-input" />
            </div>
            <div class="form-group">
              <label>{{ t('tagManager.fontSize') }} ({{ tabSizeConfig.primaryTab.fontSize }}px)</label>
              <input type="range" v-model.number="tabSizeConfig.primaryTab.fontSize" min="8" max="20"
                class="range-input" />
            </div>
          </div>

          <!-- 二级分类配置 -->
          <div class="config-section">
            <h3>{{ t('tagManager.groupTabConfig') }}</h3>
            <div class="form-group">
              <label>{{ t('tagManager.tabWidth') }}</label>
              <div class="width-control">
                <label class="radio-label">
                  <input type="radio" v-model="tabSizeConfig.groupTab.width" value="fit-content" />
                  {{ t('tagManager.fitContent') }}
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="tabSizeConfig.groupTab.width" value="custom" />
                  {{ t('tagManager.customWidth') }}
                </label>
                <input v-if="tabSizeConfig.groupTab.width !== 'fit-content'" type="number"
                  v-model.number="tabSizeConfig.groupTab.width" min="50" max="300" class="number-input" />
              </div>
            </div>
            <div class="form-group">
              <label>{{ t('tagManager.tabHeight') }} ({{ tabSizeConfig.groupTab.height }}px)</label>
              <input type="range" v-model.number="tabSizeConfig.groupTab.height" min="20" max="60"
                class="range-input" />
            </div>
            <div class="form-group">
              <label>{{ t('tagManager.fontSize') }} ({{ tabSizeConfig.groupTab.fontSize }}px)</label>
              <input type="range" v-model.number="tabSizeConfig.groupTab.fontSize" min="8" max="20"
                class="range-input" />
            </div>
          </div>
        </div>
        <div class="weilin-tools-dialog-footer">
          <button class="reset-btn" @click="resetTabSizeConfig">{{ t('tagManager.resetDefault') }}</button>
          <button class="cancel-btn" @click="closeTabSizeDialog">{{ t('common.cancel') }}</button>
          <button class="confirm-btn" @click="saveTabSizeConfig">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <ImportTagDialog ref="importTagDialogItem" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { isTrustedMessage } from '@/utils/post_message'
import { useI18n } from 'vue-i18n'
import { tagsApi } from '@/api/tags'
import message from '@/utils/message'
import { useTagStore } from '@/stores/tagStore';
import ImportTagDialog from "./import_tag.vue";
import yaml from 'js-yaml';

const tagStore = useTagStore();
const { t } = useI18n()

// 状态管理
const categories = ref([]);
const selectedCategory = ref(null)
const subCategories = ref([])
const currentTags = ref([])

// 标签网格分页 + 关键字过滤（单组最多 1000 条，分页渲染避免大 DOM 与长列表滚动卡顿）
const TAG_PAGE_SIZE = 200
const tagPage = ref(1)
const tagSearchKeyword = ref('')
const filteredTags = computed(() => {
  const kw = tagSearchKeyword.value.trim().toLowerCase()
  if (!kw) return currentTags.value
  return currentTags.value.filter(t =>
    (t.desc || '').toLowerCase().includes(kw) ||
    (t.text || '').toLowerCase().includes(kw))
})
const pagedTags = computed(() => {
  const start = (tagPage.value - 1) * TAG_PAGE_SIZE
  return filteredTags.value.slice(start, start + TAG_PAGE_SIZE)
})
const tagTotalPages = computed(() => Math.max(1, Math.ceil(filteredTags.value.length / TAG_PAGE_SIZE)))
const setTagPage = (p) => {
  tagPage.value = Math.min(Math.max(1, p), tagTotalPages.value)
}

// ========== 双搜索框 ==========
// 全局搜索框直接绑定 searchQuery（watch(searchQuery) 负责搜索与下拉）；
// 本组过滤框直接绑定 tagSearchKeyword，输入时重置到第一页


const selectedGroup = ref(null)
const showCategoryDialog = ref(false)
const showTagDialog = ref(false)
const isEditingCategory = ref(false)
const isEditingTag = ref(false)
const categoryType = ref('primary') // 'primary' 或 'group'
const selectedTags = ref([]); // 用于存储选中的标签ID
const isSelectTagAction = ref(false)
const showMoveGroupDialog = ref(false)
import { uuidv7 } from "uuidv7";

const hoverTabsActionFrist = ref('None');
const hoverTabsActionSecond = ref('None');
const editGroupTabs = ref(0); // 添加编辑模式状态
const editGroupCategroy = ref(0); // 添加编辑模式状态

const highlightedTagId = ref(null); // 添加高亮状态
const isAutoAddSearchTag = ref(0); // 添加高亮状态

// 顶部工具栏折叠状态（localStorage 持久化，刷新后保持）
const isToolbarCollapsed = ref(localStorage.getItem('weilin_tag_manager_toolbar_collapsed') === '1')
const toggleToolbarCollapse = () => {
  isToolbarCollapsed.value = !isToolbarCollapsed.value
  localStorage.setItem('weilin_tag_manager_toolbar_collapsed', isToolbarCollapsed.value ? '1' : '0')
}


// 新增状态变量
const showMoveDialog = ref(false);
const moveTargetTagId = ref(null);
const movePosition = ref('before');
const currentMoveTagId = ref(null);


const moveGroupPosition = ref('before');
const currentMoveGroupId = ref(null);
const moveTargetGroupId = ref(null);

// 批量删除
const isDeleteTagAction = ref(false);
// 批量分享
const isShareTagAction = ref(false);


// 新增状态变量
const showTabSizeConfig = ref(false)
const tabSizeConfig = ref({
  primaryTab: {
    width: 'fit-content',
    height: 34,
    fontSize: 10
  },
  groupTab: {
    width: 'fit-content',
    height: 34,
    fontSize: 10
  }
})

// 默认配置
const defaultTabSizeConfig = {
  primaryTab: {
    width: 'fit-content',
    height: 34,
    fontSize: 10
  },
  groupTab: {
    width: 'fit-content',
    height: 34,
    fontSize: 10
  }
}

const props = defineProps({
  tagManager: {
    type: String,
    default: 'prompt'
  }
})

// 当前编辑的数据
const currentCategory = ref({
  name: '',
  color: 'rgba(255, 123, 2, .4)',
  id_index: '',
  groups: []
})

const currentGroup = ref({
  name: '',
  id_index: '',
  color: 'rgba(255, 123, 2, .4)',
  tags: []
})

const currentTag = ref({
  text: '',
  desc: '',
  id_index: '',
  color: 'rgba(255, 123, 2, .4)'
})

const rgbaToColorPickerState = (rgba) => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
  if (match) {
    const [, r, g, b, a] = match;
    const hex = `#${((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1)}`;
    const alpha = a ? Math.round(parseFloat(a) * 100) : 100; // 将 alpha 转换为百分比
    return { hex, alpha };
  }
  return { hex: '#FFFFFF', alpha: 100 }; // 默认值
};

// 获取标签列表
const getTagsList = () => {
  window.postMessage({
    type: 'weilin_prompt_ui_tag_manager_refresh'
  }, '*')
}

const refreshTagsGoThis = async () => {
  try {
    await tagsApi.getTagMainGroup().then((res) => {
      // console.log(res);
      categories.value = res
    }).catch((err) => {
      console.error(err);
      message({ type: "warn", str: 'message.networkError' });
    });

    // 如果当前分类存在，重新设置当前分类
    if (selectedCategory.value) {
      // console.log(selectedCategory.value)
      await getSubCategories(selectedCategory.value.p_uuid);
    }

    // 选择了二级分类就获取tag
    if (selectedGroup.value) {
      // console.log(selectedGroup.value)
      await getTagList(selectedGroup.value.g_uuid);
    }

  } catch (error) {
    console.error('Tag管理器列表失败:', error)
  }
}


const getSubCategories = async (p_uuid) => {
  try {
    await tagsApi.getTagSubGroup(p_uuid).then((res) => {
      // console.log(res);
      subCategories.value = res
    }).catch((err) => {
      console.error(err);
      message({ type: "warn", str: 'message.networkError' });
    });
  } catch (error) {
    console.error('二级分类列表失败:', error)
  }
}


const getTagList = async (g_uuid) => {
  try {
    await tagsApi.getTagList(g_uuid).then((res) => {
      // console.log(res);
      currentTags.value = res
      // 切换分组后重置过滤与页码
      tagSearchKeyword.value = ''
      tagPage.value = 1
    }).catch((err) => {
      console.error(err);
      message({ type: "warn", str: 'message.networkError' });
    });
  } catch (error) {
    console.error('Tag列表失败:', error)
  }
}


onMounted(() => {
  updateSearchResultsStyle() // 初始化样式
  // 添加全局点击事件监听
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updateSearchResultsStyle)
  window.addEventListener('message', handleMessage)
  window.addEventListener('keydown', handleKeydown) // 监听键盘事件

  // 加载标签尺寸配置
  loadTabSizeConfig()

  // categories.value = tagStore.categories
  // if (categories.value.length <= 0) {
  getTagsList()
  // }
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateSearchResultsStyle)
  window.removeEventListener('message', handleMessage)
  window.removeEventListener('keydown', handleKeydown) // 移除键盘事件监听
})


// 选择分类
const selectCategory = async (category) => {
  // console.log(category.p_uuid)
  selectedCategory.value = category
  selectedGroup.value = null
  isSelectTagAction.value = false
  selectedTags.value = []
  await getSubCategories(category.p_uuid)
}

// 选择分组
const selectGroup = async (group) => {
  selectedGroup.value = group
  isSelectTagAction.value = false
  selectedTags.value = []
  await getTagList(group.g_uuid)
}

// 显示添加分类对话框
const showAddCategoryDialog = (type) => {
  categoryType.value = type
  isEditingCategory.value = false
  colorPickerState.value = rgbaToColorPickerState('rgba(255, 123, 2, .4)')
  if (type === 'primary') {
    currentCategory.value = {
      name: '',
      color: 'rgba(255, 123, 2, .4)',
      groups: []
    }
  } else {
    currentGroup.value = {
      name: '',
      color: 'rgba(255, 123, 2, .4)',
      tags: []
    }
  }
  showCategoryDialog.value = true
}

// 编辑分类
const editCategory = (category) => {
  isEditingCategory.value = true
  categoryType.value = 'primary'
  currentCategory.value = { ...category }
  colorPickerState.value = rgbaToColorPickerState(category.color)
  showCategoryDialog.value = true
}

// 编辑分组
const editGroup = (group) => {
  isEditingCategory.value = true
  categoryType.value = 'group'
  currentGroup.value = { ...group }
  colorPickerState.value = rgbaToColorPickerState(group.color)
  showCategoryDialog.value = true
}

// 保存分类或分组
const saveCategory = () => {
  if (categoryType.value === 'primary') {
    if (!currentCategory.value.name) {
      message({ type: "warn", str: 'tagManager.categoryNameRequired' });
      return
    }

    if (isEditingCategory.value) {
      const index = categories.value.findIndex(c => c.id_index === currentCategory.value.id_index)
      if (index !== -1) {
        // console.log(categories.value)
        tagsApi
          .editPrimaryCategory({
            id_index: currentCategory.value.id_index,
            name: currentCategory.value.name,
            color: currentCategory.value.color,
          })
          .then((res) => {
            if (res.code === 200) {
              getTagsList()
              message({ type: "success", str: 'message.editSuccess' });
            } else if (res.code === 201) {
              message({ type: "error", str: 'message.editNameExist' });
            } else {
              message({ type: "error", str: 'message.editFailed' });
            }
          })
          .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
          });
      }
    } else {
      tagsApi
        .addPrimaryCategory({
          name: currentCategory.value.name,
          color: currentCategory.value.color,
        })
        .then((res) => {
          if (res.code === 200) {
            getTagsList()
            message({ type: "success", str: 'message.addSuccess' });
          } else if (res.code === 201) {
            message({ type: "error", str: 'message.editNameExist' });
          } else {
            message({ type: "error", str: 'message.addFailed' });
          }
        })
        .catch((err) => {
          message({ type: "warn", str: 'message.networkError' });
        });
    }
  } else {
    if (!currentGroup.value.name) {
      message({ type: "warn", str: 'tagManager.groupNameRequired' });
      return
    }

    if (isEditingCategory.value) {
      tagsApi
        .editSubCategory({
          id_index: currentGroup.value.id_index,
          name: currentGroup.value.name,
          color: currentGroup.value.color,
        })
        .then((res) => {
          if (res.code === 200) {
            getTagsList()
            message({ type: "success", str: 'message.editSuccess' });
          } else if (res.code === 201) {
            message({ type: "error", str: 'message.editNameExist' });
          } else {
            message({ type: "error", str: 'message.editFailed' });
          }
        })
        .catch((err) => {
          message({ type: "warn", str: 'message.networkError' });
        });
    } else {
      tagsApi
        .addSubCategory({
          name: currentGroup.value.name,
          color: currentGroup.value.color,
          key: selectedCategory.value.id_index,
          p_uuid: selectedCategory.value.p_uuid,
        })
        .then((res) => {
          if (res.code === 200) {
            getTagsList()
            message({ type: "success", str: 'message.addSuccess' });
          } else if (res.code === 201) {
            message({ type: "error", str: 'message.editNameExist' });
          } else {
            message({ type: "error", str: 'message.editFailed' });
          }
        })
        .catch((err) => {
          message({ type: "warn", str: 'message.networkError' });
        });
    }
  }

  closeCategoryDialog()
}

// 获取分类对话框标题
const getCategoryDialogTitle = () => {
  if (isEditingCategory.value) {
    return categoryType.value === 'primary'
      ? t('tagManager.editPrimaryCategory')
      : t('tagManager.editSubCategory')
  }
  return categoryType.value === 'primary'
    ? t('tagManager.addPrimaryCategory')
    : t('tagManager.addSubCategory')
}

// 关闭分类对话框
const closeCategoryDialog = () => {
  showCategoryDialog.value = false
  currentCategory.value = {
    id: '',
    name: '',
    parentId: null,
    subCategories: [],
    backgroundColor: 'transparent'
  }
  // 重置颜色选择器
  colorPickerState.value = {
    hex: '#FFFFFF',
    alpha: 0
  }
}


// 显示添加标签对话框
const showAddTagDialog = () => {
  if (!selectedGroup.value) return

  isEditingTag.value = false
  currentTag.value = {
    id: '',
    text: '',
    desc: '',
    categoryId: selectedGroup.value.id,
    g_uuid: selectedGroup.value.g_uuid,
    backgroundColor: currentGroup.value.color // 设置默认颜色
  }
  // 初始化颜色选择器
  colorPickerState.value = rgbaToColorPickerState(currentGroup.value.color)
  showTagDialog.value = true
}

// 编辑标签
const editTag = (tag) => {
  isEditingTag.value = true
  currentTag.value = { ...tag }
  colorPickerState.value = rgbaToColorPickerState(tag.color)
  showTagDialog.value = true
}

// 保存标签
const saveTag = () => {
  if (!currentTag.value.text || !currentTag.value.desc) {
    message({ type: "warn", str: 'tagManager.textRequired' });
    return
  }

  if (isEditingTag.value && selectedGroup.value) {
    tagsApi
      .editTags({
        id_index: currentTag.value.id_index,
        text: currentTag.value.text,
        desc: currentTag.value.desc,
        color: currentTag.value.color,
      })
      .then((res) => {
        getTagsList()
        window.postMessage({
          type: 'weilin_prompt_ui_refresh_all_data',
        }, '*')
        message({ type: "success", str: 'message.editSuccess' });
      })
      .catch((err) => {
        message({ type: "warn", str: 'message.networkError' });
      });
  } else if (selectedGroup.value) {
    tagsApi
      .addNewTags({
        id_index: selectedGroup.value.id_index,
        g_uuid: selectedGroup.value.g_uuid,
        text: currentTag.value.text,
        desc: currentTag.value.desc,
        color: currentTag.value.color ? currentTag.value.color : 'rgba(255, 123, 2, .4)',
      })
      .then((res) => {
        getTagsList()
        window.postMessage({
          type: 'weilin_prompt_ui_refresh_all_data',
        }, '*')
        message({ type: "success", str: 'message.addSuccess' });
      })
      .catch((err) => {
        message({ type: "warn", str: 'message.networkError' });
      });
  }

  closeTagDialog()
}

// 关闭标签对话框
const closeTagDialog = () => {
  showTagDialog.value = false
  currentTag.value = {
    text: '',
    desc: '',
    color: 'rgba(255, 123, 2, .4)'
  }
  isEditingTag.value = false
}

// 颜色选择器状态
const colorPickerState = ref({
  hex: '#FFFFFF',
  alpha: 100
})

// 预览颜色计算属性
const previewColor = computed(() => {
  return hexToRgba(colorPickerState.value.hex, colorPickerState.value.alpha)
})

// 更新颜色（统一处理分类和标签）
const updateColor = () => {
  const color = hexToRgba(colorPickerState.value.hex, colorPickerState.value.alpha)
  if (showCategoryDialog.value) {
    if (categoryType.value === 'primary') {
      currentCategory.value.color = color
    } else {
      currentGroup.value.color = color
    }
  } else if (showTagDialog.value) {
    currentTag.value.color = color
  }
}

// 改进的 RGBA 转换函数
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
}

// 搜索相关的状态
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

// 搜索处理函数
const handleSearch = async () => {
  isSearching.value = searchQuery.value.trim().length > 0
  searchResultIndex.value = -1 // 新一轮搜索清掉键盘高亮
  // 打开下拉时按输入框当前位置定位（不依赖 CSS 默认 top，避免偏差）
  if (isSearching.value) updateSearchResultsStyle()
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    searchResults.value = []
    return
  }

  searchResults.value = []
  // 搜索匹配
  await tagsApi.searchTag(query)
    .then((res) => {
      searchResults.value = res
    })
    .catch((err) => {
      message({ type: "warn", str: 'message.networkError' });
    });

}

// 监听搜索输入
watch(searchQuery, () => {
  handleSearch()
})

// ============ 下拉键盘选择高亮（两个搜索框共用模式） ============
const searchResultIndex = ref(-1)      // 全局搜索下拉当前高亮项
const filterSuggestionIndex = ref(-1)  // 本组过滤下拉当前高亮项
const searchResultsListRef = ref(null)
const filterSuggestionsListRef = ref(null)

// 键盘移动高亮时把当前项滚进可视区
const scrollSuggestionIntoView = (listRef, index) => {
  nextTick(() => {
    const el = listRef.value?.querySelectorAll('.search-result-item')[index]
    if (el) el.scrollIntoView({ block: 'nearest' })
  })
}

const handleSearchKeydown = (event) => {
  const count = searchResults.value.length
  if (count === 0) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    searchResultIndex.value = (searchResultIndex.value + 1) % count
    scrollSuggestionIntoView(searchResultsListRef, searchResultIndex.value)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    searchResultIndex.value = searchResultIndex.value <= 0 ? count - 1 : searchResultIndex.value - 1
    scrollSuggestionIntoView(searchResultsListRef, searchResultIndex.value)
  } else if (event.key === 'Enter' && searchResultIndex.value >= 0 && searchResultIndex.value < count) {
    event.preventDefault()
    navigateToResult(searchResults.value[searchResultIndex.value])
  }
}

const handleFilterKeydown = (event) => {
  const count = filterSuggestions.value.length
  if (count === 0) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    filterSuggestionIndex.value = (filterSuggestionIndex.value + 1) % count
    scrollSuggestionIntoView(filterSuggestionsListRef, filterSuggestionIndex.value)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    filterSuggestionIndex.value = filterSuggestionIndex.value <= 0 ? count - 1 : filterSuggestionIndex.value - 1
    scrollSuggestionIntoView(filterSuggestionsListRef, filterSuggestionIndex.value)
  } else if (event.key === 'Enter' && filterSuggestionIndex.value >= 0 && filterSuggestionIndex.value < count) {
    event.preventDefault()
    navigateToLocalTag(filterSuggestions.value[filterSuggestionIndex.value])
  }
}

// ============ 本组过滤框补全：在当前分组内按关键词联想，点击定位高亮该标签 ============
const isFilterSearching = ref(false)
const filterSuggestions = ref([])

const handleFilterSearch = () => {
  const kw = tagSearchKeyword.value.trim().toLowerCase()
  filterSuggestionIndex.value = -1 // 新一轮过滤清掉键盘高亮
  if (!kw) {
    isFilterSearching.value = false
    filterSuggestions.value = []
    return
  }
  isFilterSearching.value = true
  // 打开下拉时按输入框当前位置定位
  updateFilterResultsStyle()
  // 数据源为当前分组的全部标签（currentTags），最多联想 50 条
  filterSuggestions.value = currentTags.value.filter(t =>
    (t.desc || '').toLowerCase().includes(kw) ||
    (t.text || '').toLowerCase().includes(kw)).slice(0, 50)
}

// 监听过滤输入（与模板 @input="setTagPage(1)" 并行：这里只负责补全）
watch(tagSearchKeyword, () => {
  handleFilterSearch()
})

// 点击过滤补全项：清空过滤词并定位高亮该标签（行为与全局搜索一致，仅限当前分组内）
const navigateToLocalTag = (tag) => {
  isFilterSearching.value = false
  tagSearchKeyword.value = ''
  highlightedTagId.value = tag.id_index
  // 分页模式下，翻到高亮标签所在页
  const hIdx = filteredTags.value.findIndex(t => t.id_index === tag.id_index)
  if (hIdx >= 0) {
    tagPage.value = Math.floor(hIdx / TAG_PAGE_SIZE) + 1
  }
  nextTick(() => {
    setTimeout(() => {
      const tagElement = document.querySelector('.tag-wrapper.highlight')
      if (tagElement) {
        tagElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    // 5秒后取消高亮
    setTimeout(() => {
      highlightedTagId.value = null
    }, 5000)
  })
}

// 跳转到搜索结果
const navigateToResult = async (result) => {
  // 先根据p_uuid查找并选择一级分类
  const primaryCategory = categories.value.find(cat => cat.p_uuid === result.p_uuid);
  if (primaryCategory) {
    await selectCategory(primaryCategory).then(async () => {
      // 然后根据g_uuid查找并选择二级分类
      await nextTick(async () => {
        const group = subCategories.value.find(g => g.g_uuid === result.g_uuid);
        if (group) {
          await selectGroup(group).then(async () => {
            // 最后高亮显示对应的标签
            await nextTick(() => {

              if (isAutoAddSearchTag.value == 1) {
                // 发送消息通知
                window.postMessage({
                  type: 'weilin_prompt_ui_insertTag',
                  tagText: result.text
                }, '*')
              }

              highlightedTagId.value = result.id_index;
              // 分页模式下，翻到高亮标签所在页（注意清掉过滤关键字，否则可能被过滤掉）
              searchQuery.value = ''
              tagSearchKeyword.value = ''
              const hIdx = filteredTags.value.findIndex(t => t.id_index === result.id_index)
              if (hIdx >= 0) {
                tagPage.value = Math.floor(hIdx / TAG_PAGE_SIZE) + 1
              }
              // 滚动到该标签位置
              setTimeout(() => {
                const tagElement = document.querySelector(`.tag-wrapper.highlight`);
                if (tagElement) {
                  tagElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);

              // 5秒后取消高亮
              setTimeout(() => {
                highlightedTagId.value = null;
              }, 5000);
            });
          });
        }
      });
    });
  }
  searchQuery.value = '' // 清空搜索
}

// 添加获取对比色的函数
const getContrastColor = (backgroundColor) => {
  // 如果背景色是透明的，返回默认文本颜色
  if (!backgroundColor || backgroundColor === 'transparent') {
    return 'var(--primary-text)'
  }

  // 解析 RGB 值
  let r, g, b, a = 1
  if (backgroundColor.startsWith('rgba')) {
    const matches = backgroundColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
    if (matches) {
      [, r, g, b, a] = matches.map(Number)
    }
  } else if (backgroundColor.startsWith('rgb')) {
    const matches = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (matches) {
      [, r, g, b] = matches.map(Number)
    }
  }

  // 如果透明度太低，返回默认文本颜色
  if (a < 0.5) {
    return 'var(--primary-text)'
  }

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// 添加标签点击处理函数
const handleTagClick = (tag) => {
  // 拖拽结束后的 click 不算点击（防止拖完误把标签插入提示词）
  if (justDragged) {
    justDragged = false
    return
  }
  if (props.tagManager === 'prompt') {
    // 发送消息通知
    window.postMessage({
      type: 'weilin_prompt_ui_insertTag',
      tagText: tag.text
    }, '*')
  }
}

// 删除相关状态
const showDeleteDialog = ref(false)
const deleteType = ref('') // 'category', 'group', 或 'tag'
const itemToDelete = ref(null)
const deleteConfirmMessage = computed(() => {
  if (!itemToDelete.value) return ''

  switch (deleteType.value) {
    case 'category':
      return t('tagManager.deletePrimaryCategoryConfirm', { name: itemToDelete.value.name })
    case 'group':
      return t('tagManager.deleteGroupConfirm', { name: itemToDelete.value.name })
    case 'tag':
      return t('tagManager.deleteTagConfirm', { name: itemToDelete.value.text })
    case 'deleteSelected':
      return t('tagManager.confirmDeleteSelected')
    default:
      return ''
  }
})

// 删除分类
const deleteCategory = (category) => {
  deleteType.value = 'category'
  itemToDelete.value = category
  showDeleteDialog.value = true
}

// 删除分组
const deleteGroup = (group) => {
  deleteType.value = 'group'
  itemToDelete.value = group
  showDeleteDialog.value = true
}

// 删除标签
const deleteTag = (tag) => {
  deleteType.value = 'tag'
  itemToDelete.value = tag
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  try {
    switch (deleteType.value) {
      case 'category':
        tagsApi
          .deletePrimaryCategory({
            p_uuid: itemToDelete.value.p_uuid,
          })
          .then((res) => {
            getTagsList()
            message({ type: "success", str: 'message.deleteSuccess' });
          })
          .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
          });
        break

      case 'group':
        tagsApi
          .deleteSubCategory({
            g_uuid: itemToDelete.value.g_uuid,
          })
          .then((res) => {
            getTagsList()
            message({ type: "success", str: 'message.deleteSuccess' });
          })
          .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
          });
        break

      case 'tag':
        tagsApi
          .deleteTags({
            id_index: itemToDelete.value.id_index,
          })
          .then((res) => {
            getTagsList()
            window.postMessage({
              type: 'weilin_prompt_ui_refresh_all_data',
            }, '*')
            message({ type: "success", str: 'message.deleteSuccess' });
          })
          .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
          });
        break

      case 'deleteSelected':
        tagsApi
          .batchDeleteTags({
            id_indexs: selectedTags.value,
          })
          .then((res) => {
            getTagsList()
            window.postMessage({
              type: 'weilin_prompt_ui_refresh_all_data',
            }, '*')
            message({ type: "success", str: 'message.deleteSuccess' });
          })
          .catch((err) => {
            message({ type: "warn", str: 'message.networkError' });
          });
        break
    }

    closeDeleteDialog()
  } catch (error) {
    console.error('删除失败:', error)
  }
}


// 分享整个一级目录
const shareCategory = async (category) => {
  const groupSql = `INSERT OR REPLACE INTO "tag_groups" ("name", "color", "create_time", "p_uuid") VALUES ('${category.name.replace(/'/g, "''")}', '${category.color}', ${category.create_time}, '${category.p_uuid}');`;
  try {
    const groupData = await tagsApi.getTagSubGroup(category.p_uuid);
    let tagSqls = [];
    tagSqls.push(groupSql);

    for (const group of groupData) {
      const subGroupSql = `INSERT OR REPLACE INTO "tag_subgroups" ("name", "color", "create_time", "p_uuid", "g_uuid") VALUES ('${group.name.replace(/'/g, "''")}', '${group.color}', ${group.create_time}, '${group.p_uuid}', '${group.g_uuid}');`;
      tagSqls.push(subGroupSql);

      try {
        const currentTags = await tagsApi.getTagList(group.g_uuid);
        currentTags.forEach(tag => {
          const tagSql = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${tag.text != null && tag.text.length > 0 ? tag.text.replace(/'/g, "''") : ''}', '${tag.desc != null && tag.desc.length > 0 ? tag.desc.replace(/'/g, "''") : ''}', '${tag.color}', ${tag.create_time}, '${tag.g_uuid}', '${uuidv7()}');`;
          tagSqls.push(tagSql);
        });
      } catch (error) {
        console.error('Tag列表失败:', error)
        message({ type: "warn", str: 'message.shareTagError' });
      }
    }


    // 创建下载链接
    const blob = new Blob([tagSqls.join('\n')], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${category.name}_export_${Date.now()}.sql`;
    link.click();

    message({ type: "success", str: 'tagManager.outputSuccess' });
  } catch (error) {
    console.error('二级分类列表失败:', error)
    message({ type: "warn", str: 'message.shareGroupError' });
  }
};



// 分享整个二级目录
const shareCategorySecond = async (group) => {
  try {
    let tagSqls = [];

    const subGroupSql = `INSERT OR REPLACE INTO "tag_subgroups" ("name", "color", "create_time", "p_uuid", "g_uuid") VALUES ('${group.name.replace(/'/g, "''")}', '${group.color}', ${group.create_time}, '${group.p_uuid}', '${group.g_uuid}');`;
    tagSqls.push(subGroupSql);

    try {
      const currentTags = await tagsApi.getTagList(group.g_uuid);
      currentTags.forEach(tag => {
        const tagSql = `INSERT OR REPLACE INTO "tag_tags" ("text", "desc", "color", "create_time", "g_uuid", "t_uuid") VALUES ('${tag.text != null && tag.text.length > 0 ? tag.text.replace(/'/g, "''") : ''}', '${tag.desc != null && tag.desc.length > 0 ? tag.desc.replace(/'/g, "''") : ''}', '${tag.color}', ${tag.create_time}, '${tag.g_uuid}', '${uuidv7()}');`;
        tagSqls.push(tagSql);
      });
    } catch (error) {
      console.error('Tag列表失败:', error)
      message({ type: "warn", str: 'message.shareTagError' });
    }


    // 创建下载链接
    const blob = new Blob([tagSqls.join('\n')], { type: 'text/sql' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${group.name}_export_${Date.now()}.sql`;
    link.click();

    message({ type: "success", str: 'tagManager.outputSuccess' });
  } catch (error) {
    console.error('二级分类列表失败:', error)
    message({ type: "warn", str: 'message.shareGroupError' });
  }
};

// 打开移动对话框
const openMoveDialog = (tag) => {
  currentMoveTagId.value = tag.id_index;
  showMoveDialog.value = true;
};


// 确认移动
const confirmMove = async () => {
  try {
    tagsApi.moveTag({
      id_index: currentMoveTagId.value,
      reference_id_index: moveTargetTagId.value,
      position: movePosition.value
    }).then((res) => {
      getTagsList();
      showMoveDialog.value = false;
      message({ type: 'success', str: t('message.moveSuccess') });
    }).catch((err) => {
      message({ type: 'error', str: t('message.moveFailed') });
    });
  } catch (error) {
    console.error('移动标签失败:', error);
    message({ type: 'error', str: t('message.moveFailed') });
  }
};

// ============ 自定义鼠标拖拽（替代 HTML5 drag&drop：规避 ComfyUI“松开鼠标以搜索文本”的
//              全局 drop 拦截，与提示词输入框的标签拖拽同一套方案） ============
const tagsGridRef = ref(null)
const dropIndicator = ref({ show: false, x: 0, y: 0, height: 0 })
const hideDropIndicator = () => { dropIndicator.value = { show: false, x: 0, y: 0, height: 0 } }

const dragTagId = ref(null)        // 正在拖拽的标签 id_index（用于源标签虚化样式）
const dragOverGroupId = ref(null)  // 悬停目标分组 id_index（分组标签高亮）
let justDragged = false            // 拖拽结束后抑制紧随其后的 click（避免误插入提示词）

const mouseDragState = {
  pending: false,  // 已按下鼠标，等待移动超过阈值
  active: false,   // 拖拽进行中
  tag: null,       // 被拖拽的标签对象
  sourceGroupId: null, // 源标签所在分组 id_index（拖拽中页面可能被悬停自动切换，落点判定以此为准）
  startX: 0, startY: 0, offsetX: 0, offsetY: 0
}
let pendingDropTarget = null  // { type: 'tag', tag, isAfter } | { type: 'group', group } | null
let groupHoverTimer = null    // 悬停分组自动切换的定时器
let groupHoverUuid = null     // 正在计时的目标分组 uuid（避免同一分组重复计时）
const GROUP_HOVER_SWITCH_DELAY = 500  // 悬停时长达到该值自动切换到目标分组

const clearGroupHoverTimer = () => {
  if (groupHoverTimer) {
    clearTimeout(groupHoverTimer)
    groupHoverTimer = null
  }
  groupHoverUuid = null
}
let dragGhostEl = null
let dragGhostSourceEl = null

const removeDragGhost = () => {
  if (dragGhostEl) {
    dragGhostEl.remove()
    dragGhostEl = null
  }
  if (dragGhostSourceEl) {
    dragGhostSourceEl.classList.remove('weilin-dragging-src')
    dragGhostSourceEl = null
  }
}

const createDragGhost = () => {
  removeDragGhost()
  const tag = mouseDragState.tag
  if (!tag) return
  const wrapper = tagsGridRef.value?.querySelector(`.tag-wrapper[data-tag-id="${tag.id_index}"]`)
  const srcMain = wrapper?.querySelector('.tag-main') || null
  const srcDesc = wrapper?.querySelector('.tag-desc') || null
  // 副行仅在"Tag 内容与描述不同"时显示，避免内容重复
  const hasSub = !!(tag.text && tag.text !== tag.desc)
  // 主行（Tag 描述）与副行（Tag 内容）样式：优先读原标签已解析的实际样式——
  // 不能用 cloneNode：克隆体挂在 body 上拿不到 scoped 样式与主题 CSS 变量，
  // 改为读取 getComputedStyle 以内联样式自绘虚影
  let mainCss = [
    'box-sizing:border-box', 'width:100%', 'padding:6px 12px',
    'border-radius:' + (hasSub ? '8px 8px 0 0' : '8px'),
    'font-size:13px', 'font-weight:500', 'line-height:1.4', 'color:#fff',
    'background-color:rgba(255,123,2,0.8)',
    'border:1px solid rgba(128,128,128,0.35)',
    'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
  ].join(';')
  let subCss = [
    'box-sizing:border-box', 'width:100%', 'padding:6px 12px',
    'border-radius:0 0 8px 8px', 'font-size:12px', 'line-height:1.4',
    'color:rgba(255,255,255,0.65)', 'background-color:rgba(60,60,60,0.9)',
    'text-align:center',
    'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
  ].join(';')
  if (srcMain) {
    const cs = getComputedStyle(srcMain)
    mainCss = [
      'box-sizing:border-box', 'width:100%',
      'padding:' + cs.padding,
      // 有副行时主行只留上圆角、去底边框（与原卡片两行衔接一致）
      'border-radius:' + (hasSub ? cs.borderRadius : '8px'),
      'font-size:' + cs.fontSize, 'line-height:' + cs.lineHeight,
      'font-family:' + cs.fontFamily, 'font-weight:' + cs.fontWeight,
      'color:' + cs.color, 'background-color:' + cs.backgroundColor,
      'border:1px solid ' + cs.borderTopColor,
      hasSub ? 'border-bottom:none' : '',
      // 文字居中：原标签 .tag-main 是 inline-flex + justify-content:center，
      // 虚影行是块级 div，需显式补 text-align/justify-content，否则文字左对齐
      'text-align:center', 'justify-content:center',
      'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
    ].filter(Boolean).join(';')
    srcMain.classList.add('weilin-dragging-src')
    dragGhostSourceEl = srcMain
  }
  if (srcDesc && hasSub) {
    const dcs = getComputedStyle(srcDesc)
    subCss = [
      'box-sizing:border-box', 'width:100%',
      'padding:' + dcs.padding,
      'border-radius:' + dcs.borderRadius,
      'font-size:' + dcs.fontSize, 'line-height:' + dcs.lineHeight,
      'font-family:' + dcs.fontFamily, 'font-weight:' + dcs.fontWeight,
      'color:' + dcs.color, 'background-color:' + dcs.backgroundColor,
      'text-align:' + dcs.textAlign, 'justify-content:center',
      'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis'
    ].join(';')
  }
  const ghost = document.createElement('div')
  ghost.className = 'weilin-drag-ghost'
  // 复用的 .weilin-drag-ghost 是提示词输入框多 chip 横排容器的样式（flex wrap + gap 8px），
  // 标签虚影是纵向两行卡片：内联覆盖为块级堆叠，消除两行之间的间隙与横排行为
  ghost.style.display = 'block'
  // 与原标签同宽：原卡片 tag-content 是 flex column，主/副行被拉伸为同一宽度；
  // 虚影固定为原卡片实际宽度，两行 100% 填满，否则各行按内容收缩会变成两个独立块
  const wRect = wrapper?.getBoundingClientRect()
  if (wRect && wRect.width > 0) {
    ghost.style.width = wRect.width + 'px'
  }
  // 完整还原原标签两行结构：主行 = Tag 描述（tag.desc），副行 = Tag 内容（tag.text）
  const mainEl = document.createElement('div')
  mainEl.style.cssText = mainCss
  mainEl.textContent = tag.desc || tag.text || ''
  ghost.appendChild(mainEl)
  if (hasSub) {
    const subEl = document.createElement('div')
    subEl.style.cssText = subCss
    subEl.textContent = tag.text
    ghost.appendChild(subEl)
  }
  document.body.appendChild(ghost)
  dragGhostEl = ghost
}

// 「移动标签」按钮单击 = 打开移动对话框；按住该按钮完成拖拽后冒泡来的 click 在此被吞掉
const handleMoveBtnClick = (tag) => {
  if (justDragged) {
    justDragged = false
    return
  }
  openMoveDialog(tag)
}

// 在「移动标签」按钮上按下鼠标：记录待判定的拖拽起点。
// 只有按住该按钮拖动才触发拖拽（单击仍是打开移动对话框，见 handleMoveBtnClick）；
// 标签主体不再启动拖拽，避免长按/划选标签时误入拖拽状态
const handleTagMouseDown = (event, tag) => {
  if (event.button !== 0) return                       // 只响应左键
  if (isSelectTagAction.value) return                  // 批量选择模式下不拖拽
  justDragged = false
  mouseDragState.pending = true
  mouseDragState.active = false
  mouseDragState.tag = tag
  // 记录源标签所在分组：拖拽过程中页面可能被悬停自动切换，落点判定以此为准
  mouseDragState.sourceGroupId = selectedGroup.value?.id_index ?? null
  mouseDragState.startX = event.clientX
  mouseDragState.startY = event.clientY
  const startEl = event.target.closest('.tag-content')
  if (startEl) {
    const r = startEl.getBoundingClientRect()
    mouseDragState.offsetX = event.clientX - r.left
    mouseDragState.offsetY = event.clientY - r.top
  } else {
    mouseDragState.offsetX = 0
    mouseDragState.offsetY = 0
  }
  hideDropIndicator()
}

// 按坐标解析落点：分组标签 → 换分组；标签网格 → 组内排序；其他 → 取消
const resolveDropTargetAt = (x, y) => {
  const el = (x == null || y == null) ? null : document.elementFromPoint(x, y)
  if (!el) return null
  const groupEl = el.closest('.group-tabs .tab-item')
  if (groupEl && groupEl.dataset.groupUuid) {
    const group = subCategories.value.find(g => g.g_uuid === groupEl.dataset.groupUuid)
    // isSource = 源标签所在分组（悬停照常高亮/自动切换，松手则放回原地取消）；
    // 其余分组 = 换分组。注意不能拿当前选中分组比较：悬停可能已自动把页面切换到目标分组
    if (group) {
      return { type: 'group', group, isSource: group.id_index === mouseDragState.sourceGroupId }
    }
    return null
  }
  const tagEl = el.closest('.tag-wrapper')
  if (tagEl && tagEl.dataset.tagId) {
    const target = pagedTags.value.find(t => String(t.id_index) === tagEl.dataset.tagId)
    if (target && mouseDragState.tag && String(target.id_index) !== String(mouseDragState.tag.id_index)) {
      const r = tagEl.getBoundingClientRect()
      return { type: 'tag', tag: target, isAfter: x > r.left + r.width / 2 }
    }
  }
  return null
}

// 更新指示线（居中显示在标签之间的空隙里）与分组高亮
const updateTagDragUi = (x, y) => {
  pendingDropTarget = resolveDropTargetAt(x, y)
  if (pendingDropTarget?.type === 'group') {
    dragOverGroupId.value = pendingDropTarget.group.id_index
    hideDropIndicator()
    // 悬停在分组上片刻自动切换过去，边拖边看该分组内的标签。
    // 对所有分组生效（含源分组，拖出后可切回原分组继续查看）；
    // 页面已停在该分组时不再重复计时，避免反复刷新列表
    const hoverGroup = pendingDropTarget.group
    if (groupHoverUuid !== hoverGroup.g_uuid
      && selectedGroup.value?.id_index !== hoverGroup.id_index) {
      clearGroupHoverTimer()
      groupHoverUuid = hoverGroup.g_uuid
      groupHoverTimer = setTimeout(() => {
        groupHoverTimer = null
        groupHoverUuid = null
        selectGroup(hoverGroup)
      }, GROUP_HOVER_SWITCH_DELAY)
    }
    return
  }
  dragOverGroupId.value = null
  clearGroupHoverTimer()
  if (pendingDropTarget?.type === 'tag') {
    const tagEl = tagsGridRef.value?.querySelector(`.tag-wrapper[data-tag-id="${pendingDropTarget.tag.id_index}"]`)
    const container = tagsGridRef.value
    if (tagEl && container) {
      const rect = tagEl.getBoundingClientRect()
      const cRect = container.getBoundingClientRect()
      // 读取标签之间的实际间距，指示线中心落在空隙正中，避免压在标签上
      const gap = parseFloat(getComputedStyle(container).columnGap) || 16
      dropIndicator.value = {
        show: true,
        x: (pendingDropTarget.isAfter ? rect.right + gap / 2 : rect.left - gap / 2) - cRect.left - 2,
        y: rect.top - cRect.top - 4,
        height: rect.height + 8
      }
      return
    }
  }
  hideDropIndicator()
}

// 文档级 mousemove：移动超过阈值正式进入拖拽，实时更新指示线/高亮与虚影位置
const handleTagDragMouseMove = (event) => {
  if (!mouseDragState.pending && !mouseDragState.active) return
  if (!mouseDragState.active) {
    const dx = event.clientX - mouseDragState.startX
    const dy = event.clientY - mouseDragState.startY
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    // 正式开始拖拽
    mouseDragState.active = true
    justDragged = true
    dragTagId.value = mouseDragState.tag?.id_index ?? null
    createDragGhost()
    document.body.classList.add('weilin-dragging-cursor')
  }
  updateTagDragUi(event.clientX, event.clientY)
  // 虚影跟随鼠标（保持按下时的抓取偏移）
  if (dragGhostEl) {
    dragGhostEl.style.left = (event.clientX - mouseDragState.offsetX) + 'px'
    dragGhostEl.style.top = (event.clientY - mouseDragState.offsetY) + 'px'
  }
}

// 拖拽状态清理
const finishTagDragUi = () => {
  removeDragGhost()
  clearGroupHoverTimer()
  document.body.classList.remove('weilin-dragging-cursor')
  dragTagId.value = null
  dragOverGroupId.value = null
  pendingDropTarget = null
  hideDropIndicator()
}

// 换分组落地：把标签移动到目标分组；tagTarget = { tag, isAfter } 时表示
// 落点在目标分组内某个标签旁边，换组成功后再插入到该位置（悬停自动切组后的精确落点）
const moveTagToGroupAction = (source, group, tagTarget) => {
  tagsApi.moveTagToGroup({
    id_index: source.id_index,
    g_uuid: group.g_uuid
  }).then(() => {
    if (tagTarget) {
      // 换组后按落点插入到目标标签前/后
      return tagsApi.moveTag({
        id_index: source.id_index,
        reference_id_index: tagTarget.tag.id_index,
        position: tagTarget.isAfter ? 'after' : 'before'
      })
    }
    return null
  }).then(() => {
    getTagsList()
    window.postMessage({
      type: 'weilin_prompt_ui_refresh_all_data',
    }, '*')
    message({ type: 'success', str: t('message.moveSuccess') });
    // 标签页面跟随切换到目标分组
    nextTick(() => { selectGroup(group) })
  }).catch(() => {
    message({ type: 'error', str: t('message.moveFailed') });
  })
}

// 文档级 mouseup：松开鼠标执行落点动作（换分组 / 组内排序），否则取消
const handleTagDragMouseUp = (event) => {
  if (mouseDragState.active) {
    const target = resolveDropTargetAt(event.clientX, event.clientY)
    const source = mouseDragState.tag
    if (target && source) {
      if (target.type === 'group') {
        // 源分组上松手 = 放回原地（取消移动）；其余分组 = 换分组
        if (!target.isSource) {
          moveTagToGroupAction(source, target.group, null)
        }
      } else if (target.type === 'tag') {
        // 目标标签一定属于当前选中分组；源标签来自其它分组（悬停已自动切组）时，
        // 先换组再插入到目标位置，否则只是原分组内的排序
        const targetGroup = selectedGroup.value
        if (targetGroup && mouseDragState.sourceGroupId != null
          && targetGroup.id_index !== mouseDragState.sourceGroupId) {
          moveTagToGroupAction(source, targetGroup, target)
        } else {
          tagsApi.moveTag({
            id_index: source.id_index,
            reference_id_index: target.tag.id_index,
            position: target.isAfter ? 'after' : 'before'
          }).then(() => {
            getTagsList()
            message({ type: 'success', str: t('message.moveSuccess') });
          }).catch(() => {
            message({ type: 'error', str: t('message.moveFailed') });
          })
        }
      }
    }
  }
  mouseDragState.pending = false
  mouseDragState.active = false
  finishTagDragUi()
}

// 注册文档级鼠标监听（自定义拖拽不依赖浏览器的放置权限机制，任何环境下都可靠）
document.addEventListener('mousemove', handleTagDragMouseMove)
document.addEventListener('mouseup', handleTagDragMouseUp)
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleTagDragMouseMove)
  document.removeEventListener('mouseup', handleTagDragMouseUp)
  finishTagDragUi()
})

const availableGroup = ref([])
const actionMoveGroup = ref(1)
// 打开移动对话框 Group
const openMoveGroupDialog = (group, action) => {
  actionMoveGroup.value = action
  if (action === 1) {
    availableGroup.value = categories.value
    currentMoveGroupId.value = group.id_index;
    showMoveGroupDialog.value = true;
  } else {
    // console.log(group)
    availableGroup.value = subCategories.value
    currentMoveGroupId.value = group.id_index;
    showMoveGroupDialog.value = true;
  }
  // console.log(group)
}


const confirmMoveGroup = async () => {
  if (actionMoveGroup.value === 1) {
    try {
      tagsApi.moveMainGroup({
        id_index: currentMoveGroupId.value,
        reference_id_index: moveTargetGroupId.value,
        position: moveGroupPosition.value
      }).then((res) => {
        getTagsList();
        showMoveGroupDialog.value = false;
        message({ type: 'success', str: t('message.moveSuccess') });
      }).catch((err) => {
        message({ type: 'error', str: t('message.moveFailed') });
      });
    } catch (error) {
      console.error('移动标签失败:', error);
      message({ type: 'error', str: t('message.moveFailed') });
    }
  } else {
    try {
      tagsApi.moveSubGroup({
        id_index: currentMoveGroupId.value,
        reference_id_index: moveTargetGroupId.value,
        position: moveGroupPosition.value
      }).then((res) => {
        getTagsList();
        showMoveGroupDialog.value = false;
        message({ type: 'success', str: t('message.moveSuccess') });
      }).catch((err) => {
        message({ type: 'error', str: t('message.moveFailed') });
      });
    } catch (error) {
      console.error('移动标签失败:', error);
      message({ type: 'error', str: t('message.moveFailed') });
    }
  }

}

const deleteTagAction = () => {
  isSelectTagAction.value = true
  isDeleteTagAction.value = true
}

const cancelDeleteAction = () => {
  isSelectTagAction.value = false
  isDeleteTagAction.value = false
  selectedTags.value = []
}

const deleteSelectedTags = () => {
  if (selectedTags.value.length === 0) return;

  // 确认删除操作
  deleteType.value = 'deleteSelected'
  itemToDelete.value = {}
  showDeleteDialog.value = true
};


const shareTagAction = () => {
  isSelectTagAction.value = true
  isShareTagAction.value = true
}

const cancelShareAction = () => {
  isSelectTagAction.value = false
  isShareTagAction.value = false
  selectedTags.value = []
}

const shareSelectedTags = () => {
  if (selectedTags.value.length === 0) {
    message({ type: "warn", str: 'tagManager.noTagsSelected' });
    return;
  }

  // 生成YAML内容
  const yamlContent = {};
  selectedTags.value.forEach(tag => {
    yamlContent[tag.text] = tag.desc;
  });

  // 创建下载链接
  const blob = new Blob([yaml.dump(yamlContent)], { type: 'text/yaml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `selected_tags_export_${Date.now()}.yaml`;
  link.click();

  message({ type: "success", str: 'tagManager.outputSuccess' });
  cancelShareAction();
};

// 关闭删除对话框
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  deleteType.value = ''
  itemToDelete.value = null
}

// 刷新标签列表
const refreshTags = async () => {
  try {
    await getTagsList()
  } catch (error) {
    console.error('刷新标签列表失败:', error)
  }
}

const searchInput = ref()
const filterSearchInput = ref()

const searchResultsStyle = ref({}) // 使用 ref 来存储样式
const filterResultsStyle = ref({}) // 本组过滤补全下拉的样式

// 下拉展开方向判定参数（与 .search-results 的 max-height 保持一致）
const DROPDOWN_MAX_HEIGHT = 300
const DROPDOWN_GAP = 4 // 下拉与输入框的间距

// 依据输入框位置与视口空间生成下拉样式：默认向下展开，
// 下方空间不足以容纳下拉（按 max-height 估算）且上方更宽裕时改为向上展开
const buildDropdownStyle = (inputEl) => {
  const rect = inputEl.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openUp = spaceBelow < DROPDOWN_MAX_HEIGHT + DROPDOWN_GAP && spaceAbove > spaceBelow
  if (openUp) {
    return {
      position: 'fixed',
      top: 'auto',
      bottom: `${window.innerHeight - rect.top + DROPDOWN_GAP}px`, // 底边贴输入框上方，留 4px 间隙
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      marginTop: '0px',
      zIndex: 1000,
    }
  }
  return {
    position: 'fixed',
    top: `${rect.bottom + DROPDOWN_GAP}px`,
    bottom: 'auto',
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    marginTop: '0px',
    zIndex: 1000,
  }
}

// 计算搜索结果的样式
const updateSearchResultsStyle = () => {
  if (searchInput.value) {
    searchResultsStyle.value = buildDropdownStyle(searchInput.value)
  }
}

// 计算本组过滤补全下拉的样式（与全局搜索下拉同款定位）
const updateFilterResultsStyle = () => {
  if (filterSearchInput.value) {
    filterResultsStyle.value = buildDropdownStyle(filterSearchInput.value)
  }
}

// 处理消息
const handleMessage = (event) => {
  if (!isTrustedMessage(event)) return
  // console.log(event.data.type)
  if (event.data.type === 'weilin_prompt_ui_window_change_tagManager_position'
    || event.data.type === 'weilin_prompt_ui_window_change_tagManager_size'
    || event.data.type === 'weilin_prompt_ui_window_change_tagManager_scroll'
    || event.data.type === 'weilin_prompt_ui_window_change_promptBox_position'
    || event.data.type === 'weilin_prompt_ui_window_change_promptBox_size'
    || event.data.type === 'weilin_prompt_ui_window_change_promptBox_scroll') {
    // 窗口位置/尺寸变化时，同步更新两个搜索下拉的定位
    updateSearchResultsStyle()
    updateFilterResultsStyle()
  } else if (event.data.type === 'weilin_prompt_ui_window_change_click_outside') {
    // console.log(event.data.event)
  } else if (event.data.type === 'weilin_prompt_ui_tag_manager_refresh') {
    refreshTagsGoThis()
  }
}

// 处理点击事件，关闭搜索结果框
const handleClickOutside = (event) => {
  if (isSearching.value && !searchInput.value.contains(event.target)) {
    isSearching.value = false // 关闭搜索结果框
    searchResultIndex.value = -1
  }
  if (isFilterSearching.value && !filterSearchInput.value?.contains(event.target)) {
    isFilterSearching.value = false // 关闭过滤补全下拉
    filterSuggestionIndex.value = -1
  }
}

// 处理键盘事件
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    isSearching.value = false // 关闭搜索结果框
    isFilterSearching.value = false // 关闭过滤补全下拉
    searchResultIndex.value = -1
    filterSuggestionIndex.value = -1
  }
}

const showTabActions = (index) => {
  if (editGroupCategroy.value == 1) {
    hoverTabsActionFrist.value = 'TabID-' + index;
  }
};

const hideTabActions = (index) => {
  hoverTabsActionFrist.value = 'None';
};

const showTabActionsGroup = (index) => {
  if (editGroupTabs.value == 1) {
    hoverTabsActionSecond.value = 'TabID-' + index;
  }
};

const hideTabActionsGroup = (index) => {
  hoverTabsActionSecond.value = 'None';
};

const importTagDialogItem = ref()
const showImportDialog = () => {
  importTagDialogItem.value.open()
}

// 从localStorage读取配置
const loadTabSizeConfig = () => {
  const defaultTabData = JSON.parse(JSON.stringify(defaultTabSizeConfig))
  try {
    const saved = localStorage.getItem('weilin_tag_manager_tab_size_config')
    if (saved) {
      const parsed = JSON.parse(saved)
      tabSizeConfig.value = { ...defaultTabData, ...parsed }
    } else {
      tabSizeConfig.value = { ...defaultTabData }
    }
  } catch (error) {
    console.error('读取标签尺寸配置失败:', error)
    tabSizeConfig.value = { ...defaultTabData }
  }
}

// 保存配置到localStorage
const saveTabSizeConfig = () => {
  try {
    localStorage.setItem('weilin_tag_manager_tab_size_config', JSON.stringify(tabSizeConfig.value))
    message({ type: "success", str: 'tagManager.tabSizeConfigSaved' });
    showTabSizeConfig.value = false
  } catch (error) {
    console.error('保存标签尺寸配置失败:', error)
    message({ type: "error", str: 'tagManager.tabSizeConfigSaveFailed' });
  }
}

// 显示配置对话框
const showTabSizeDialog = () => {
  showTabSizeConfig.value = true
}

// 关闭配置对话框
const closeTabSizeDialog = () => {
  showTabSizeConfig.value = false
  // 重新从localStorage加载，撤销未保存的更改
  loadTabSizeConfig()
}

// 重置为默认值
const resetTabSizeConfig = () => {
  const defaultTabData = JSON.parse(JSON.stringify(defaultTabSizeConfig))
  tabSizeConfig.value = { ...defaultTabData }
}

</script>

<style scoped>
/* 折叠条：整条可点击（实线边框，与工具栏间距节奏一致） */
.toolbar-collapse-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    position: relative;
    height: 18px;
    /* 折叠条不再自带下边距：折叠态由 .toolbar 的 padding-bottom 提供统一 4px 间隙，
       展开态由 .toolbar-top 的 padding-top 提供，避免 margin 与 padding 叠加成 8px */
    margin-bottom: 0;
    border: 1px solid var(--weilin-prompt-ui-border-color, rgba(255, 255, 255, 0.2));
    border-radius: 4px;
    background: transparent;
    color: var(--weilin-prompt-ui-primary-color, #40a9ff);
    font-size: 11px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s, color 0.2s;
}

.toolbar-collapse-bar:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--weilin-prompt-ui-primary-text, #fff);
}

/* 箭头绝对定位到左端，文字在条内真正居中对称 */
.toolbar-collapse-arrow {
    position: absolute;
    left: 8px;
    top: 50%;
    margin-top: -6px; /* 图标 12px 高的一半 */
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

/* 收起态箭头朝下（点击向下展开） */
.toolbar-collapse-arrow.rotated {
    transform: rotate(180deg);
}

/* 收起/展开统一间距：折叠条 margin-bottom 6px 与工具栏 6px 节奏一致，
   不再用折叠态特例 padding（之前 4px vs 12px 导致两种状态占位不一致） */
.tag-manager {
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px 16px;
  background: var(--weilin-prompt-ui-primary-bg);
  height: 100%;
  box-sizing: border-box;
}

.category-tabs {
  display: flex;
  flex-direction: column;
  /* 一级分类行与分组行之间的留白收紧到 4px */
  gap: 4px;
  /* 分组行与下方标签列表的留白收紧到 4px，与折叠条间距节奏一致 */
  margin-bottom: 4px;
}

.tabs-wrapper {
  position: relative;
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.tabs-scroll {
  display: flex;
  gap: 2px;
  padding: 0 2px 2px;
  flex-wrap: wrap;
  align-items: flex-end;
}

/* 自定义滚动条样式 */
.tabs-scroll::-webkit-scrollbar {
  height: 10px;
  /* 设置滚动条高度 */
}

.tabs-scroll::-webkit-scrollbar-track {
  background: var(--weilin-prompt-ui-scrollbar-track);
  /* 滚动条轨道颜色 */
}

.tabs-scroll::-webkit-scrollbar-thumb {
  background: var(--weilin-prompt-ui-scrollbar-thumb);
  /* 滚动条颜色 */
  border-radius: 3px;
  /* 滚动条圆角 */
}

.tabs-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--weilin-prompt-ui-scrollbar-thumb-hover);
  /* 滚动条悬停颜色 */
}

.tab-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 2px 15px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-bottom: none;
  position: relative;
  font-size: 10px;
  height: 34px;
  min-width: unset;
  width: fit-content;
}

.tab-text {
  flex: 0 0 auto;
  white-space: nowrap;
  text-align: center;
  margin: 0 4px;
  color: var(--weilin-prompt-ui-primary-text);
}

.tab-actions {
  display: flex;
  gap: 2px;
  align-items: center;
  transition: opacity 0.3s;
  position: absolute;
  margin-left: 0;
  top: -25px;
  padding: 5px;
  background-color: #00000080;
  border-radius: 4px;
  z-index: 1000;
}

.action-btn {
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  opacity: 1;
}

.action-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.add-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  background: none;
  border: 1px dashed var(--weilin-prompt-ui-border-color);
  border-radius: 4px 4px 0 0;
  color: var(--weilin-prompt-ui-secondary-text);
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  font-size: 13px;
  height: 28px;
  width: fit-content;
}

.add-tab:hover {
  color: var(--weilin-prompt-ui-primary-color);
  border-color: var(--weilin-prompt-ui-primary-color);
  background: var(--weilin-prompt-ui-secondary-bg);
}

.plus-icon {
  font-size: 16px;
  line-height: 1;
}

/* 暗色主题适配 */
:root[data-theme="dark"] .tab-item {
  background: var(--weilin-prompt-ui-primary-bg);
}

:root[data-theme="dark"] .tab-item:hover {
  background: var(--weilin-prompt-ui-secondary-bg);
}

:root[data-theme="dark"] .add-tab:hover {
  background: var(--weilin-prompt-ui-secondary-bg);
}

.tags-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tags-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags-title {
  font-size: 20px;
  font-weight: bolder;
  color: var(--weilin-prompt-ui-primary-text);
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  /* 顶部留白收紧到 4px，让标签紧跟上方分组行；左右与底部保持 16px 不变 */
  padding: 4px 16px 16px;
  /* 作为拖拽插入指示线 .drop-indicator 的定位基准 */
  position: relative;
}

/* 标签过滤与分页工具条 */
.tags-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 16px 0 16px;
}

.tag-list-search {
  flex: 1;
  max-width: 260px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 6px;
  background: var(--weilin-prompt-ui-input-bg, transparent);
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.tag-list-search:focus {
  border-color: var(--weilin-prompt-ui-primary-color);
}

.tag-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-page-info {
  font-size: 12px;
  color: var(--weilin-prompt-ui-secondary-text);
  min-width: 48px;
  text-align: center;
}

.tag-page-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag-page-btn:hover:not(:disabled) {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.tag-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tag-wrapper {
  display: inline-flex;
  min-width: 100px;
  max-width: 200px;
  flex-direction: column;
  border-radius: 4px;
}

/* 拖拽中的源标签：虚化表示已被"拿起" */
.tag-wrapper.dragging {
  opacity: 0.35;
}

/* 拖拽时原位置的原标签：轮廓保持清晰（实线主色），仅淡化内容 —— 与提示词输入框一致 */
.tag-main.weilin-dragging-src {
  border-color: var(--weilin-prompt-ui-primary-color, #1890ff) !important;
  background-color: transparent !important;
  box-shadow: none;
}

.tag-main.weilin-dragging-src > * {
  opacity: 0.3;
}

/* 拖拽插入位置指示线（与提示词输入框一致：居中显示在标签之间的空隙里） */
.drop-indicator {
  position: absolute;
  width: 4px;
  border-radius: 2px;
  background-color: var(--weilin-prompt-ui-primary-color, #1890ff);
  box-shadow: 0 0 5px var(--weilin-prompt-ui-primary-color-fade, rgba(24, 144, 255, 0.65));
  pointer-events: none;
  z-index: 100;
}

/* 拖拽标签悬停到分组标签上：目标分组高亮提示可放置 */
.tab-item.drag-over-group {
  border-color: var(--weilin-prompt-ui-primary-color);
  background: var(--weilin-prompt-ui-hover-bg-color);
  filter: brightness(1.2);
}

.tag-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: fit-content;
  /* 鼠标拖拽排序时避免触发文本原生选择 */
  user-select: none;
}

.tag-main {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--weilin-prompt-ui-primary-text);
  transition: all 0.3s ease;
  cursor: default;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-bottom: none;
  width: 100%;
  box-sizing: border-box;
  justify-content: center;
}

.tag-desc {
  font-size: 12px;
  color: var(--weilin-prompt-ui-secondary-text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  background-color: var(--weilin-prompt-ui-secondary-bg);
  padding: 6px 12px;
  border-radius: 0 0 8px 8px;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-top: none;
}

.tag-actions {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  position: absolute;
  right: 8px;
  display: inline-flex;
  opacity: 0;
  transition: opacity 0.2s ease;
  top: -15px;
}

.tag-content:hover .tag-actions {
  opacity: 1;
}

.action-btn {
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn svg {
  width: 12px;
  height: 12px;
  fill: var(--weilin-prompt-ui-secondary-text);
  transition: fill 0.2s ease;
}

.action-btn:hover svg {
  fill: var(--weilin-prompt-ui-primary-text);
}

/* 添加动画效果 */
.tag-content:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 2px 4px var(--weilin-prompt-ui-shadow-color));
}

.tag-wrapper:active .tag-content {
  transform: translateY(0);
}

/* 没有描述时的样式 */
.tag-wrapper:not(:has(.tag-desc)) .tag-main {
  border-radius: 16px;
  border-bottom: 1px solid var(--border-color);
}

/* 滚动条样式 */
.primary-tabs::-webkit-scrollbar,
.sub-tabs::-webkit-scrollbar {
  height: 6px;
  /* 横向滚动条的高度 */
  width: 6px;
}

.primary-tabs::-webkit-scrollbar-track,
.sub-tabs::-webkit-scrollbar-track {
  background: var(--weilin-prompt-ui-scrollbar-track);
  border-radius: 3px;
}

.primary-tabs::-webkit-scrollbar-thumb,
.sub-tabs::-webkit-scrollbar-thumb {
  background: var(--weilin-prompt-ui-scrollbar-thumb);
  border-radius: 3px;
}

.primary-tabs::-webkit-scrollbar-thumb:hover,
.sub-tabs::-webkit-scrollbar-thumb:hover {
  background: var(--weilin-prompt-ui-scrollbar-thumb-hover);
}

/* 对话框样式 */
.weilin-tools-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.weilin-tools-dialog-content {
  background: var(--weilin-prompt-ui-primary-bg);
  border-radius: 8px;
  min-width: 400px;
  max-width: 90%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  z-index: 10099;
}

.weilin-tools-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.weilin-tools-dialog-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--primary-text);
}

.weilin-tools-dialog-body {
  padding: 20px;
  box-sizing: border-box;
}

.weilin-tools-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.form-group {
  margin-bottom: 16px;
  box-sizing: border-box;
  width: 100%;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--primary-text);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-input-bg);
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--weilin-prompt-ui-primary-color);
  box-shadow: 0 0 0 2px rgba(var(--weilin-prompt-ui-primary-color-rgb), 0.1);
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: none;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  color: var(--weilin-prompt-ui-secondary-text);
}

.confirm-btn {
  background: var(--weilin-prompt-ui-primary-color);
  border: none;
  color: white;
}

.cancel-btn:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.confirm-btn:hover {
  opacity: 0.9;
}

.close-btn {
  border: none;
  background: none;
  font-size: 20px;
  color: var(--weilin-prompt-ui-secondary-text);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: var(--weilin-prompt-ui-primary-text);
}

/* 确认对话框特定样式 */
.confirm-weilin-tools-dialog {
  min-width: 300px !important;
  max-width: 400px !important;
  width: 90%;
  box-sizing: border-box;
}

.confirm-message {
  margin: 0;
  color: var(--weilin-prompt-ui-primary-text);
  text-align: center;
}

.delete-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: var(--weilin-prompt-ui-danger-color, #ff4d4f);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  opacity: 0.9;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-delete-btn {
  background: none;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  color: var(--weilin-prompt-ui-secondary-text);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-delete-btn:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

/* 对话框动画 */
.weilin-tools-dialog-overlay {
  animation: fadeIn 0.2s ease;
}

.weilin-tools-dialog-content {
  animation: slideIn 0.2s ease;
  z-index: 10099;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.color-picker {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-secondary-bg);
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
}

.color-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-input {
  width: 100%;
  height: 32px;
  padding: 0;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  cursor: pointer;
}

.alpha-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alpha-slider {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  background: linear-gradient(to right, transparent, currentColor);
  border-radius: 4px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--weilin-prompt-ui-primary-color);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.alpha-value {
  min-width: 48px;
  text-align: right;
  color: var(--weilin-prompt-ui-secondary-text);
}

/* 确保标签和分类显示透明背景 */
.primary-tab,
.sub-tab,
.tag-card {
  position: relative;
  background-color: transparent;
}

/* 搜索区域样式 */
.search-container {
  position: relative;
  z-index: 100;
}

/* 下拉打开时提升所在容器的层级：search-container 自身是 z-index:100 的层叠上下文，
   下拉（z-index:1000）被困在其中，与 DOM 靠后的过滤框容器（同为 z-index:100）比较时
   按顺序后者在上，导致补全下拉被过滤搜索框遮挡；激活的容器提升到 200 解决 */
.search-container.search-active {
  z-index: 200;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-input-bg);
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--weilin-prompt-ui-primary-color);
  box-shadow: 0 0 0 2px var(--weilin-prompt-ui-primary-color-fade);
}

.search-results {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  background: var(--weilin-prompt-ui-primary-bg);
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  margin-top: 4px;
  box-shadow: 0 2px 8px var(--weilin-prompt-ui-shadow-color);
  z-index: 1000;
}

.search-result-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--weilin-prompt-ui-border-color);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.selected {
  background: var(--weilin-prompt-ui-hover-bg-color);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-text {
  font-size: 14px;
  color: var(--weilin-prompt-ui-primary-text);
}

.result-path {
  font-size: 12px;
  color: var(--weilin-prompt-ui-secondary-text);
}

.no-results {
  padding: 12px;
  text-align: center;
  color: var(--weilin-prompt-ui-secondary-text);
  font-size: 14px;
}

.tab-item.active {
  border-color: var(--weilin-prompt-ui-primary-color);
}

.tab-item.active .action-btn {
  color: #ffffff;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-btn {
  font-size: 14px;
}

.toolbar {
  flex-direction: column;
  /* 水平内边距由根容器 .tag-manager 提供（16px），这里不再叠加，
     让折叠条/工具栏与下方分类、标签列表左右边界对齐 */
  padding: 4px 0;
}

.toolbar .toolbar-top {
  display: flex;
  align-items: stretch;
  gap: 12px;
  /* 工具栏内容与下方分类区的间隙统一为 4px 节奏（由 .toolbar 的 padding-bottom 提供，
     此处不再叠加 margin，避免与折叠条/分类区间隙不一致）；
     与折叠条之间的 4px 由这里的 padding-top 提供（折叠条自身无下边距） */
  margin-bottom: 0;
  padding-top: 4px;
}

/* 工具栏左侧搜索区：全局搜索在上、本组过滤在下 */
.toolbar-search-stack {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 与全局 4px 间隙节奏统一 */
  flex: 1;
  min-width: 0;
}

.toolbar-search-stack .search-container {
  flex: 1;
  min-width: 0;
}

/* 工具栏右侧按钮区：两行右对齐，与左侧两行搜索框对齐 */
.toolbar-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px; /* 两行按钮间隙，与全局 4px 节奏统一 */
  flex-shrink: 0;
}

.toolbar-actions-row {
  display: flex;
  align-items: center;
  /* 与工具栏整体 6px 间隙节奏统一 */
  gap: 6px;
}

/* 搜索框与按钮行同高（32px 基准） */
.toolbar-search-stack .search-input {
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
}

/* 工具栏内的"自动添加搜索标签"开关与按钮行同高 */
.toolbar-actions .group-edit-mode {
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 4px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background: var(--weilin-prompt-ui-secondary-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: var(--weilin-prompt-ui-hover-bg-color);
  border-color: var(--weilin-prompt-ui-primary-color);
}

.refresh-icon {
  fill: var(--weilin-prompt-ui-primary-text);
}

.search-container {
  flex: 1;
}

.tags-actions {
  width: fit-content;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.tag-checkbox {
  margin-top: 3px;
  /* 复选框与标签文本之间的间距 */
}

.radio-input {
  width: 16px !important;
  height: 16px !important;
  margin-top: 3px;
}

.toolbar-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 5px;
}

.group-edit-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  background: none;
  border: 1px dashed var(--weilin-prompt-ui-border-color);
  border-radius: 4px 4px 0 0;
  color: var(--weilin-prompt-ui-secondary-text);
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  font-size: 13px;
  height: 28px;
  width: fit-content;
  cursor: pointer;
}

.group-edit-mode:hover {
  color: var(--weilin-prompt-ui-primary-color);
  border-color: var(--weilin-prompt-ui-primary-color);
  background: var(--weilin-prompt-ui-secondary-bg);
}


.highlight {
  border: 2px solid var(--weilin-prompt-ui-primary-color);
  box-shadow: 0 0 8px rgba(255, 123, 2, 0.6);
  transform: scale(1.05);
  transition: all 0.3s ease;
}

/* 添加按钮样式 */
.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background-color: var(--weilin-prompt-ui-primary-color);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.import-btn:hover {
  opacity: 0.9;
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--weilin-prompt-ui-secondary-bg);
}


.share-btn {
  background: var(--weilin-prompt-ui-primary-color);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.share-btn:hover {
  opacity: 0.9;
}

.share-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.delete-action-btn {
  background: var(--weilin-prompt-ui-primary-color);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.delete-action-btn:hover {
  opacity: 0.9;
}

.delete-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.share-selected-btn {
  background: var(--weilin-prompt-ui-success-color);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.share-selected-btn:hover {
  opacity: 0.9;
}

.share-selected-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* 新增按钮样式 */
.tab-size-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  background-color: var(--weilin-prompt-ui-secondary-bg);
  color: var(--weilin-prompt-ui-primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  white-space: nowrap;
}

/* 工具栏按钮统一尺寸：以“修改标签尺寸”(tab-size-btn) 为基准——
   高 32px、字号 12px、水平内边距 12px、单行不换行。
   带 ID 前缀以覆盖 theme.css 中 #weilin… .add-btn 的 8px/16px 旧内边距；
   刷新按钮为 32x32 图标方钮，不参与统一 */
#weilin_comfyui_tools_prompt_ui_div .tag-manager .toolbar .toolbar-top button:not(.refresh-btn) {
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}

.tab-size-btn:hover {
  background-color: var(--weilin-prompt-ui-hover-bg-color);
  border-color: var(--weilin-prompt-ui-primary-color);
}

/* 标签尺寸配置对话框样式 */
.tab-size-weilin-tools-dialog {
  min-width: 500px;
  max-width: 600px;
}

.config-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--weilin-prompt-ui-border-color);
  border-radius: 8px;
  background: var(--weilin-prompt-ui-secondary-bg);
}

.config-section h3 {
  margin: 0 0 16px 0;
  color: var(--weilin-prompt-ui-primary-text);
  font-size: 16px;
}

.width-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: auto !important;
  margin: 0;
}

.number-input {
  width: 100px !important;
  margin-top: 8px;
}

.range-input {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  background: var(--weilin-prompt-ui-border-color);
  border-radius: 4px;
  outline: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--weilin-prompt-ui-primary-color);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.reset-btn {
  background: var(--weilin-prompt-ui-warning-color, #faad14);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  opacity: 0.9;
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--weilin-prompt-ui-border-color);
  margin: 0 4px;
}


</style>

<style>
/* 拖拽虚影挂在 document.body 上，scoped 样式作用不到，需用全局样式（与提示词输入框同名同款） */
.weilin-drag-ghost {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99999;
    display: flex;
    flex-flow: wrap;
    gap: 8px;
    pointer-events: none;
    opacity: 0.85;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

/* 拖拽期间强制统一光标（防止经过按钮/标签时光标样式变来变去） */
body.weilin-dragging-cursor,
body.weilin-dragging-cursor * {
    cursor: grabbing !important;
}
</style>