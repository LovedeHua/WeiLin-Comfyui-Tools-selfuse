<template>
  <!-- 74.86：Lora 面板展开时给根加激活类，整条高度链交给 CSS flex 分配（见 prompt_index.css） -->
  <div ref="promptBoxEl" class="weilin_prompt_ui_prompt-box" :class="{ 'weilin-lora-embed-active': showLoraManager }">
    <!-- Lora栈 -->
    <LoraStack v-if="props.promptManager === 'prompt'" :is-open="loraOpen" :selected-loras="selectedLoras"
      @close="closeLora" />
    <!-- 主要内容容器 -->
    <div :class="`${prefix}main-content`" :style="{ width: mainContentWidth }">
      <!-- 操作栏 -->
      <div class="center-container">

        <div class="action-item">
          <button class="language-switch-btn" @click.stop="toggleLanguageSelector" ref="langBtnRef"
            :title="t('controls.language')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="translate-icon">
              <path
                d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
            </svg>
            <span class="action-text">{{ t('controls.language') }}</span>
          </button>
          <Transition name="fade">
            <LanguageSwitcher v-if="showLanguageSelector" ref="languageSwitcherRef" @close="closeLanguageSelector" />
          </Transition>
        </div>

        <div class="action-item">
          <ThemeSwitch :title="t('controls.switchTheme')">
            <template #default="{ isDark, mode }">
              <span class="action-text">{{ themeModeText(mode, isDark) }}</span>
            </template>
          </ThemeSwitch>
        </div>

        <div class="action-item">
          <button class="settings-btn" @click="openSettings" :title="t('controls.settings')">
            <svg class="settings-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            <span class="action-text">{{ t('controls.settings') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openTagManager" :title="t('controls.tagManager')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tag-icon">
              <path
                d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
            <span class="action-text">{{ t('controls.tagManager') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openDanbooruManager" :title="t('controls.danbooruManager')">
            <svg class="tag-icon" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
            <span class="action-text">{{ t('controls.danbooruManager') }}</span>
          </button>
        </div>

        <div class="action-item" v-if="props.hasPromptLoraStack">
          <button class="tag-manager-btn" @click="toggleLora" :title="t('controls.loraStack')">
            <svg sxmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="tag-icon" width="24" height="24">
              <path
                d="M902.5 485.1c-59-17.5-113.8-3.4-155 27.7V365.1c0-45.2-36.9-82.1-82.1-82.1H511.2c31.1-41.2 45.2-96 27.7-155C522.2 71.6 475 26.1 418 12 303.4-16.5 200.9 69.4 200.9 179.3c0 39.1 13.5 74.7 35.3 103.7H82.1C36.9 283 0 319.9 0 365.1v113.1c0 25.5 27.9 38.8 49.5 25.3 38.8-24.3 87.8-33.6 139.4-19.5 57 15.6 103.4 62.5 118.4 119.7 30.1 115.5-56.2 219.4-166.8 219.4-33.5 0-64.7-9.6-91.1-26.2C27.8 783.4 0 796.8 0 822.2v113.2c0 45.2 36.9 82.1 82.1 82.1h583.3c45.2 0 82.1-36.9 82.1-82.1V787.7c29 21.9 64.6 35.3 103.7 35.3 109.9 0 195.8-102.5 167.3-217.1-14.1-56.9-59.7-104.1-116-120.8z">
              </path>
            </svg>
            <span class="action-text">{{ t('controls.loraStack') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openLoraManager" :title="t('controls.loraManager')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="tag-icon" width="24" height="24">
              <path
                d="M129 128h350v80H209v224h270v80H129V128zM129 895V576h768v319H129z m80-239v159h608V656H209zM730 356c19.882 0 36-16.118 36-36s-16.118-36-36-36-36 16.118-36 36 16.118 36 36 36z">
              </path>
              <path
                d="M578.517 214.386a32.002 32.002 0 0 0-16.01 27.731l0.058 155.918a31.998 31.998 0 0 0 16 27.701l135.156 78.033a32.002 32.002 0 0 0 31.99 0.006l135.058-77.909a32.002 32.002 0 0 0 16.01-27.731l-0.058-155.918a32 32 0 0 0-16-27.701l-135.157-78.033a31.998 31.998 0 0 0-31.989-0.005l-135.058 77.908z m67.002 58.058l84.033-48.591 84.181 48.715 0.034 95.24-84.034 48.591-84.18-48.714-0.034-95.241z">
              </path>
            </svg>
            <span class="action-text">{{ t('controls.loraManager') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openHistoryBox" :title="t('controls.history')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="tag-icon" width="24" height="24">
              <path
                d="M653.7 85.83c-235.05 0-426.29 191.25-426.29 426.3s191.24 426.3 426.29 426.3c235.06 0 426.3-191.25 426.3-426.3S888.76 85.83 653.7 85.83z m0 779.98c-195.01 0-353.67-158.65-353.67-353.68S458.69 158.45 653.7 158.45c195.02 0 353.68 158.65 353.68 353.68S848.72 865.81 653.7 865.81z">
              </path>
              <path
                d="M866.78 634.19L695.93 533.61V302.59c0-20.06-16.26-36.31-36.31-36.31s-36.31 16.26-36.31 36.31v253.66c0 17.06 11.8 31.26 27.66 35.16l178.98 105.36c17.28 10.17 39.54 4.41 49.71-12.87 10.17-17.28 4.4-39.54-12.88-49.71zM44.76 324.51h186.42c20.05 0 36.31-16.26 36.31-36.31s-16.26-36.31-36.31-36.31H44.76c-20.05 0-36.31 16.26-36.31 36.31s16.26 36.31 36.31 36.31zM231.18 703.25H44.76c-20.05 0-36.31 16.26-36.31 36.31s16.26 36.31 36.31 36.31h186.42c20.05 0 36.31-16.26 36.31-36.31s-16.25-36.31-36.31-36.31zM36.31 550.19h118.8c20.05 0 36.31-16.26 36.31-36.31s-16.26-36.31-36.31-36.31H36.31c-20.05 0-36.31 16.26-36.31 36.31 0 20.06 16.26 36.31 36.31 36.31z">
              </path>
            </svg>
            <span class="action-text">{{ t('controls.history') }}</span>
          </button>
        </div>

        <!-- 收藏夹窗口按钮 -->
        <div class="action-item">
          <button class="tag-manager-btn" @click="openFavoritesBox" :title="t('controls.favorites')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tag-icon" width="24" height="24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span class="action-text">{{ t('controls.favorites') }}</span>
          </button>
        </div>

        <!-- 新增 AI 对话按钮 -->
        <div class="action-item">
          <button class="tag-manager-btn" @click="openAIChat" :title="t('controls.aiChat')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tag-icon" width="24" height="24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              <path d="M6 14h12v2H6zm0-3h12v2H6zm0-3h12v2H6z" />
            </svg>
            <span class="action-text">{{ t('controls.aiChat') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openGitHub" :title="t('controls.github')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tag-icon" width="24" height="24">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span class="action-text">{{ t('controls.github') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="shareCloudData" :title="t('controls.shareCloudData')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="tag-icon" width="24" height="24">
              <path
                d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <span class="action-text">{{ t('controls.shareCloudData') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openBilibili" :title="t('controls.tutorialVideo')">
            <svg t="1745234292993" class="tag-icon" viewBox="0 0 1024 1024" version="1.1"
              xmlns="http://www.w3.org/2000/svg" p-id="1496" width="128" height="128">
              <path
                d="M204.288 63.488c-8.704 8.192-16.896 20.48-18.944 26.624-3.584 11.776 12.8 62.464 20.48 62.464S235.52 176.128 235.52 184.32c0 16.384-17.92 26.112-47.104 26.112-34.816 0-104.448 27.648-128.512 51.2-9.216 8.704-26.112 33.792-37.888 56.32L0 358.4v469.504l21.504 40.448c24.576 47.616 35.84 59.392 82.944 84.992l40.96 22.528h722.944l40.96-19.968c51.712-24.576 72.704-45.056 95.744-94.72l17.92-38.4v-231.424l0.512-231.424-17.92-36.352c-9.216-20.48-28.16-47.104-42.496-59.904-31.232-30.208-86.528-54.272-122.368-54.272-54.272 0-65.024-22.528-26.624-57.856 20.48-18.432 23.04-25.088 23.04-45.568 0-19.968-3.584-28.16-16.896-41.984-9.216-9.216-22.528-16.896-29.696-16.896-11.776 0-34.304 9.216-40.448 16.896-1.536 1.536-35.84 35.328-75.776 74.24l-73.216 71.168-83.456-0.512c-45.568 0-88.064-2.56-93.696-4.608-5.632-2.56-38.4-31.232-72.704-65.024C249.856 40.448 235.008 32.256 204.288 63.488z m652.8 262.656c5.12 0.512 19.968 9.216 31.744 20.48l21.504 19.968 1.536 217.088c1.024 197.12 0.512 218.112-8.704 236.032-14.336 27.136-34.816 40.448-65.536 41.984-14.336 0.512-173.568 0.512-353.28 0l-326.144-1.536-45.056-45.056V373.248l20.992-22.528c15.872-17.92 25.6-23.552 41.984-25.088 16.384-1.024 634.88-0.512 680.96 0.512z"
                p-id="1497"></path>
              <path
                d="M279.04 502.272c-20.48 22.016-20.992 25.088-20.992 66.56 0 39.936 1.024 44.544 17.92 64 29.184 33.28 55.808 32.256 84.48-2.56 11.264-12.8 12.8-22.016 13.312-64 0-47.104-0.512-48.64-19.968-68.096-27.136-27.648-47.616-26.112-74.752 4.096z m393.216-3.584c-18.944 18.944-19.968 20.992-19.968 69.12 0 47.616 0.512 49.664 18.432 67.072 24.576 23.552 35.84 26.624 58.368 13.824 29.184-16.896 39.936-43.52 36.864-90.624-2.56-35.328-4.608-41.984-22.016-59.904-25.088-25.6-45.568-25.6-71.68 0.512z"
                p-id="1498"></path>
            </svg>
            <span class="action-text">{{ t('controls.tutorialVideo') }}</span>
          </button>
        </div>

        <div class="action-item">
          <button class="tag-manager-btn" @click="openSponsor" :title="t('controls.sponsor')">
            <svg t="1745823985128" class="tag-icon" viewBox="0 0 1322 1024" version="1.1"
              xmlns="http://www.w3.org/2000/svg" width="24" height="24">
              <path
                d="M495.899049 634.906371c-17.304811 0-31.251971 13.947161-31.251971 31.251971S478.594238 697.410314 495.899049 697.410314c17.304811 0 31.251971-13.947161 31.251971-31.251972 0-17.304811-13.947161-31.251971-31.251971-31.251971zM790.855671 728.662285c-17.304811 0-31.251971 13.947161-31.251972 31.251971s13.947161 31.251971 31.251972 31.251972 31.251971-13.947161 31.251971-31.251972c0-17.04653-13.947161-30.993691-31.251971-31.251971z">
              </path>
              <path
                d="M1262.99289 719.622459c-13.430599-8.264984-28.927445-13.430599-44.68257-14.980284 34.867902-84.974368 57.080047-196.293374-18.596215-306.837537-115.193217-168.657333-280.75118-256.73107-491.766556-260.863562-60.179416-1.291404-130.948343 1.549685-205.849762 4.649054-87.040614 3.35765-203.008673 8.006703-281.526023 1.549684 15.755126-8.523265 32.543375-16.788249 47.007098-23.761829 55.530362-27.119479 98.921529-48.04022 84.457807-85.232649-7.748423-21.695583-30.218848-33.059937-67.411277-34.09306C206.624604-1.755689 37.967271 43.443443 7.748423 119.636265c-17.04653 42.874605-19.887618 125.524447 152.902206 198.876182 71.027208 30.218848 271.969635 66.894715 349.453861 74.643138 17.563091 1.549685 34.867902 5.165615 51.397871 11.364353-17.821372 11.622634-35.901025 24.02011-54.238959 36.417586-31.768533-18.079653-83.941245-39.516955-122.683358-13.172318-14.463722 9.298107-23.503549 25.053233-24.02011 42.358044-0.516562 21.179022 12.397476 42.099763 26.861198 58.629731-57.080047 45.715694-103.312302 89.881703-119.84227 123.974762-18.337934 41.841482-25.828075 110.544163 8.523265 177.438879 43.391167 84.974368 138.955046 144.120661 284.625391 176.147474 190.352916 41.583202 354.619476 4.132492 463.355674-53.205835 60.437697-32.026814 103.570583-69.994085 124.233043-103.828864 6.457019 2.066246 12.914038 4.132492 19.629338 6.198738 9.298107 2.841088 18.596214 5.682177 27.37776 8.781546 28.669164 10.072949 60.695977 8.523265 85.232649-3.61593l1.291403-0.774843c17.821372-9.039826 31.510252-25.053233 37.708991-44.166009 15.238565-51.139589-29.444006-79.033911-56.563486-96.08044z m-811.776412-239.684541l-17.30481 12.655757c-5.165615-5.165615-9.814669-11.106072-13.430599-17.563091 6.7153-2.066246 18.337934 0.258281 30.735409 4.907334zM1262.99289 798.139808c-1.291404 3.874211-4.132492 6.97358-9.298107 9.814669-10.33123 5.165615-25.569795 5.423896-39.258675 0.774842-9.298107-3.35765-19.371057-6.457019-29.444006-9.556388-18.596214-5.682177-49.848186-15.238565-55.788643-22.470426-9.814669-12.914038-28.152602-15.755126-41.32492-5.940457s-15.755126 28.152602-5.940458 41.324921c3.615931 4.390773 7.490142 8.264984 12.139196 11.622634-44.940851 62.245662-242.267348 186.220424-521.468844 125.007885-125.782728-27.636041-210.498815-77.742507-244.850155-145.412065-24.794952-48.815063-19.112776-98.921529-7.231861-126.299289 34.09306-71.027208 280.75118-234.518925 438.30244-327.241716 13.947161-8.264984 18.596214-26.344637 10.33123-40.291798s-27.119479-19.629337-40.291797-10.33123c-12.655757 7.490142-55.788643 33.059937-111.060725 68.186119-18.596214-12.655757-50.881309-27.894322-102.537459-33.059936-81.874999-8.264984-270.936512-44.42429-332.149051-70.252366C139.471608 245.418993 40.033517 196.34565 61.987381 141.073568c5.165615-12.914038 29.185725-33.576498 81.100157-53.464116 35.384463-13.430599 72.318611-22.470426 109.769321-27.119479l-11.622634 5.682176c-35.384463 17.304811-73.868296 36.417586-99.954652 59.146293-1.807965-1.033123-3.615931-2.324527-5.165615-3.874211-10.847792-11.622634-29.185725-12.397476-41.06664-1.291404l-0.516562 0.516561c-11.880915 11.106072-12.139195 29.702287-1.033123 41.583202 10.589511 11.106072 26.086356 19.371057 45.715694 25.569795 0.774842 0.258281 1.291404 0.516562 2.066246 0.774842 68.702681 21.179022 190.611197 18.596214 362.367899 11.622634 74.126577-2.841088 144.120661-5.682177 202.492111-4.649054 193.710566 3.874211 339.122631 80.841876 444.75946 235.552049 64.828469 95.047318 41.583202 188.544951 4.390773 269.903388-4.649054-3.615931-9.039826-7.748423-12.655757-12.139195-10.33123-12.397476-28.669164-14.463722-41.324921-4.649054-12.655757 10.072949-14.722003 28.669164-4.649054 41.324921 5.940457 7.490142 36.675867 42.874605 74.643138 39.775236h2.066246c1.291404-0.258281 2.324527 0 3.615931-0.258281 25.828075-4.649054 42.358044-3.615931 57.596608 6.198738 20.40418 12.914038 30.218848 20.40418 28.410883 26.861199z">
              </path>
            </svg>
            <span class="action-text">{{ t('controls.sponsor') }}</span>
          </button>
        </div>



        <SettingDialog ref="settingDialog" />

      </div>

      <div style="position: relative;" ref="parentCneterBox">
        <!-- 输入框区域 -->
        <!-- 移除事件 @change="finishPromptPutItHistory" -->
        <textarea v-model="inputText" class="input-area" @input="handleInput" :placeholder="t('promptBox.placeholder')"
          @keydown="handleKeydown" @blur="onBlur" rows="6" ref="inputAreaRef" @mouseup="saveTextareaHeight"
          @resize="saveTextareaHeight"></textarea>

        <!-- 添加token计数器 -->
        <div class="token-counter">
          {{ tokenCount }} tokens
        </div>

        <style>
          .token-counter {
            position: absolute;
            bottom: 5px;
            left: 5px;
            z-index: 10;
            color: #aaa;
            background-color: #f0f0f0;
            /* 灰色背景，可调整深浅 */
            padding: 2px 6px;
            /* 给文字一点内边距，看起来更清晰 */
            border-radius: 4px;
            /* 圆角，可选 */
            user-select: none;
            /* 禁止文字被选中 */
          }
        </style>

        <!-- 自动补全窗口 -->
        <div class="autocomplete-container" ref="autocompleteContainerRef" :style="{
          top: `${autocompletePosition.top}px`,
          left: `${adjustedAutocompletePosition.left}px`,
          display: showAutocomplete ? 'block' : 'none',
          width: `${saveAutoCompleteWidth}px`
        }">
          <!-- 关闭按钮置于滚动区外：列表滚动时固定在右上角，不随内容滚走 -->
          <button class="close-autocomplete-btn" @click.stop="closeAutocomplete">×</button>
          <div class="autocomplete-scroll" :style="{ maxHeight: `${saveAutoCompleteHeight}px` }">
            <div v-for="(item, index) in autocompleteResults" :key="index" class="autocomplete-item"
              :class="{ selected: index === selectedAutocompleteIndex }"
              @mouseenter="selectedAutocompleteIndex = index"
              @click.stop="selectAutocomplete(index, $event)"
              :ref="el => { if (el && index === selectedAutocompleteIndex) selectedItemRef = el }">
              <span class="tag">{{ item.text }}</span>
              <span class="desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>

      </div>

      <!--  中间小工具栏  -->
      <div class="prompt-input-translate-area">

        <!-- 添加翻译输入框和按钮 -->
        <div style="display: flex; align-items: center;">
          <input type="text" v-model="translateText" class="prompt-input-translate-area-textarea"
            @keyup.enter="finishTranslateEnter()" :placeholder="t('promptBox.translatePlaceholder')" />
          <button class="translate-btn" style="margin-left: 8px;" @click="finishTranslateEnter()">
            翻译
          </button>
        </div>

        <!-- 中间功能按钮组：2 行 × 3 列网格排列（视觉顺序由 CSS order 控制） -->
        <div class="tool-buttons-grid">
        <!-- 添加一键翻译按钮 -->
        <button v-if="isTranslateTagEnabled" class="translate-btn random-tag-settings-btn one-click-translate-btn"
          @click="oneClickTranslatePrompt" :title="t('promptBox.oneClickTranslate')">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="token-item-icon" width="24"
            height="24">
            <path
              d="M677.676657 294.6142c19.165116 57.5433 44.715939 102.2992 89.431879 147.0551 38.322239-38.3622 63.873063-89.5118 83.038178-147.0551h-172.470057z m-421.56861 319.685h166.076358l-83.038179-223.7795-83.038179 223.7795z"
              p-id="2419"></path>
            <path
              d="M894.854661 0.504H128.353929C58.095158 0.504 0.607803 58.0473 0.607803 128.378v767.244c0 70.3307 57.487355 127.874 127.746126 127.874h766.500733c70.258771 0 127.746126-57.5433 127.746126-127.874V128.378c0-70.3307-51.101647-127.874-127.746126-127.874zM581.867062 825.2913c-12.771416 12.7874-25.550824 12.7874-38.322239 12.7874-6.3937 0-19.165116 0-25.550824-6.3937-6.3937-6.3937-12.779408 0-12.779408-6.3937s-6.385708-12.7874-12.771415-25.5748c-6.3937-12.7874-6.3937-19.1811-12.779408-31.9685l-25.542832-70.3307H230.557224L205.0064 767.748c-12.771416 25.5748-19.165116 44.7559-25.550824 57.5433-6.3937 12.7874-19.165116 12.7874-38.322239 12.7874-12.779408 0-25.550824-6.3937-38.330231-12.7874-12.771416-12.7874-19.157124-19.1811-19.157124-31.9685 0-6.3937 0-12.7874 6.385708-25.5748 6.3937-12.7874 6.3937-19.1811 12.771416-31.9685l140.525533-358.0472c6.3937-12.7874 6.3937-25.5748 12.779408-38.3622 6.385708-12.7874 12.771416-25.5748 19.157124-31.9685 6.3937-6.3937 12.779408-19.1811 25.550823-25.5748 12.779408-6.3937 25.550824-6.3937 38.330232-6.3937 12.771416 0 25.542832 0 38.322239 6.3937 12.771416 6.3937 19.165116 12.7874 25.550824 25.5748 6.385708 6.3937 12.771416 19.1811 19.157124 31.9685 6.3937 12.7874 12.779408 25.5748 19.165115 44.7559l140.525534 351.6535c12.771416 25.5748 19.165116 44.7559 19.165116 57.5433-6.3937 6.3937-12.779408 19.1811-19.165116 31.9685zM933.176901 575.937c-70.258771-25.5748-121.360418-57.5433-166.076358-95.9055-44.707947 44.7559-102.195302 76.7244-172.462065 95.9055l-19.157124-31.9685c70.258771-19.1811 127.746126-44.7559 172.462066-89.5118C703.22748 409.7008 664.905241 352.1575 652.125833 288.2205h-63.873063v-25.5748h172.470058c-12.7874-19.1811-25.558816-44.7559-38.330232-63.937l19.157124-6.3937c12.779408 19.1811 31.944524 44.7559 44.715939 70.3307h159.682658v31.9685h-63.873063c-19.157124 63.937-51.093655 121.4803-89.423887 159.8425 44.715939 38.3622 95.809594 70.3307 166.076358 89.5118l-25.550824 31.9685z"
              p-id="2420"></path>
          </svg>
          <span style="margin-left: 5px;" class="action-text">{{ t('promptBox.oneClickTranslate') }}</span>
        </button>

        <!-- 添加设置随机Tag规则按钮 -->
        <button v-if="isRandomTagSettingsEnabled" class="translate-btn random-tag-settings-btn"
          @click="openRandomTagSettings" :title="t('promptBox.randomTagSettings')">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="utils-item-icon" width="24"
            height="24">
            <path
              d="M512 409.6c-56.32 0-102.4 46.08-102.4 102.4s46.08 102.4 102.4 102.4 102.4-46.08 102.4-102.4-46.08-102.4-102.4-102.4z m0 153.6c-28.16 0-51.2-23.04-51.2-51.2s23.04-51.2 51.2-51.2 51.2 23.04 51.2 51.2-23.04 51.2-51.2 51.2z">
            </path>
            <path
              d="M512 204.8c-25.6 0-51.2 2.56-76.8 7.68l-15.36-61.44c-2.56-10.24-10.24-17.92-20.48-20.48-10.24-2.56-20.48 0-28.16 7.68l-76.8 76.8c-5.12 5.12-7.68 12.8-7.68 20.48s2.56 15.36 7.68 20.48l76.8 76.8c5.12 5.12 12.8 7.68 20.48 7.68 2.56 0 5.12 0 7.68-2.56 10.24-2.56 17.92-10.24 20.48-20.48l15.36-61.44c25.6-5.12 51.2-7.68 76.8-7.68 140.8 0 256 115.2 256 256s-115.2 256-256 256-256-115.2-256-256c0-25.6 2.56-51.2 7.68-76.8l61.44-15.36c10.24-2.56 17.92-10.24 20.48-20.48 2.56-10.24 0-20.48-7.68-28.16l-76.8-76.8c-5.12-5.12-12.8-7.68-20.48-7.68s-15.36 2.56-20.48 7.68l-76.8 76.8c-7.68 7.68-10.24 17.92-7.68 28.16 2.56 10.24 10.24 17.92 20.48 20.48l61.44 15.36c-5.12 25.6-7.68 51.2-7.68 76.8 0 168.96 138.24 307.2 307.2 307.2s307.2-138.24 307.2-307.2-138.24-307.2-307.2-307.2z">
            </path>
          </svg>
          <span class="action-text">{{ t('promptBox.randomTagSettings') }}</span>
        </button>

        <!-- 添加一键随机Tag按钮 -->
        <button v-if="isRandomTagEnabled" class="translate-btn random-tag-btn" @click="oneClickRandomTag"
          :title="t('promptBox.oneClickRandomTag')">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="utils-item-icon" width="24"
            height="24">
            <path
              d="M832 512c0-176-144-320-320-320S192 336 192 512s144 320 320 320 320-144 320-320z m-384 0c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m128-128c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m-256 0c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m128-128c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m256 256c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m-256 0c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m-128 128c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z m256 0c0-35.2 28.8-64 64-64s64 28.8 64 64-28.8 64-64 64-64-28.8-64-64z">
            </path>
          </svg>
          <span class="action-text">{{ t('promptBox.oneClickRandomTag') }}</span>
        </button>

        <!-- 删除按钮显示开关 -->
        <button v-if="isDeleteButtonEnabled" class="translate-btn toggle-delete-btn" @click="toggleDeleteButton"
          :title="showDeleteButton ? t('promptBox.hideDeleteButton') : t('promptBox.showDeleteButton')"
          :class="{ 'active': showDeleteButton }">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="utils-item-icon" width="24" height="24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              fill="currentColor" />
          </svg>
          <span class="action-text">{{ showDeleteButton ? t('promptBox.hideDeleteButton') :
            t('promptBox.showDeleteButton')
          }}</span>
        </button>

        <!-- 一键清空按钮 -->
        <button v-if="isClearAllEnabled" class="translate-btn clear-all-btn" @click="clearAllPrompt"
          :title="t('promptBox.oneClickCleanAll')">
          <svg class="utils-item-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="1605" width="24" height="24">
            <path
              d="M716.8 338.944H307.2v-102.4a76.8 76.8 0 0 1 76.8-76.8h256a77.312 77.312 0 0 1 76.8 76.8z m-358.4-51.2h307.2v-51.2a26.112 26.112 0 0 0-25.6-25.6h-256a25.6 25.6 0 0 0-25.6 25.6zM702.464 856.576H321.536A65.024 65.024 0 0 1 256 791.04V406.528a25.6 25.6 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v384.512a14.336 14.336 0 0 0 13.824 14.336h380.928a14.848 14.848 0 0 0 14.336-14.336V406.528a25.6 25.6 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v384.512a65.536 65.536 0 0 1-65.024 65.536z">
            </path>
            <path
              d="M432.128 678.912a25.6 25.6 0 0 1-25.6-25.6v-220.16a25.6 25.6 0 0 1 25.6-25.6 26.112 26.112 0 0 1 25.6 25.6v220.16a25.6 25.6 0 0 1-25.6 25.6z">
            </path>
            <path
              d="M593.408 678.912a25.6 25.6 0 0 1-25.6-25.6v-220.16a26.112 26.112 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v220.16a25.6 25.6 0 0 1-25.6 25.6z">
            </path>
            <path
              d="M828.416 338.944H196.096a25.6 25.6 0 0 1-25.6-25.6 25.6 25.6 0 0 1 25.6-25.6h632.32a25.6 25.6 0 0 1 25.6 25.6 25.6 25.6 0 0 1-25.6 25.6z">
            </path>
          </svg>
          <span class="action-text">{{ t('promptBox.oneClickCleanAll') }}</span>
        </button>

        <!-- 一键清空禁用按钮 -->
        <button v-if="isClearDisabledEnabled" class="translate-btn clear-disabled-btn" @click="clearDisabledTags"
          :title="t('promptBox.oneClickClearDisabled')">
          <svg class="utils-item-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
            p-id="1605" width="24" height="24">
            <path
              d="M716.8 338.944H307.2v-102.4a76.8 76.8 0 0 1 76.8-76.8h256a77.312 77.312 0 0 1 76.8 76.8z m-358.4-51.2h307.2v-51.2a26.112 26.112 0 0 0-25.6-25.6h-256a25.6 25.6 0 0 0-25.6 25.6zM702.464 856.576H321.536A65.024 65.024 0 0 1 256 791.04V406.528a25.6 25.6 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v384.512a14.336 14.336 0 0 0 13.824 14.336h380.928a14.848 14.848 0 0 0 14.336-14.336V406.528a25.6 25.6 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v384.512a65.536 65.536 0 0 1-65.024 65.536z">
            </path>
            <path
              d="M432.128 678.912a25.6 25.6 0 0 1-25.6-25.6v-220.16a25.6 25.6 0 0 1 25.6-25.6 26.112 26.112 0 0 1 25.6 25.6v220.16a25.6 25.6 0 0 1-25.6 25.6z">
            </path>
            <path
              d="M593.408 678.912a25.6 25.6 0 0 1-25.6-25.6v-220.16a26.112 26.112 0 0 1 25.6-25.6 25.6 25.6 0 0 1 25.6 25.6v220.16a25.6 25.6 0 0 1-25.6 25.6z">
            </path>
            <path
              d="M828.416 338.944H196.096a25.6 25.6 0 0 1-25.6-25.6 25.6 25.6 0 0 1 25.6-25.6h632.32a25.6 25.6 0 0 1 25.6 25.6 25.6 25.6 0 0 1-25.6 25.6z">
            </path>
          </svg>
          <span class="action-text">{{ t('promptBox.oneClickClearDisabled') }}</span>
        </button>

        <!-- 快速收藏按钮：弹出名称输入窗后把当前提示词与已加载 Lora 存入收藏夹 -->
        <button class="translate-btn quick-fav-btn" @click="quickFavorite" :title="t('controls.quickFavorite')">
          <svg class="utils-item-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
          </svg>
          <span class="action-text">{{ t('controls.quickFavorite') }}</span>
        </button>
        </div>

        <!-- 标签搜索栏（row-reverse 布局的最后一个子元素，显示在最左侧；带补全下拉） -->
        <div class="tag-search-bar" v-if="tokens.length > 0">
          <div class="tag-search-wrap">
            <input type="text" v-model="tagSearchQuery" class="tag-search-input"
              :placeholder="t('promptBox.searchTags')"
              @focus="updateTagSearchSuggestionPos" @input="onTagSearchInput" @blur="closeTagSearchSuggestions"
              @keydown="handleTagSearchKeydown" @keydown.esc="clearTagSearch">
            <button class="tag-search-clear" v-if="tagSearchQuery" @click="clearTagSearch" :title="t('promptBox.delete')">×</button>
            <!-- 补全建议下拉（fixed 定位向上展开，避免被工具栏的 overflow 裁剪） -->
            <div class="tag-search-suggestions" v-if="tagSearchSuggestions.length > 0"
              :style="{ bottom: tagSearchSuggestionPos.bottom + 'px', left: tagSearchSuggestionPos.left + 'px' }">
            <div v-for="(s, i) in tagSearchSuggestions" :key="s.text" class="tag-search-suggestion"
                :class="{ selected: i === tagSearchSuggestionIndex }"
                @mousedown.prevent="selectTagSearchSuggestion(s)">
                <span class="suggestion-text">{{ s.text }}</span>
                <span v-if="s.translate" class="suggestion-translate">{{ s.translate }}</span>
            </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 词组显示区域 -->
      <div class="tokens-container" ref="tokensContainerRef" v-if="tokens.length > 0">
        <template v-for="(token, index) in tokens" :key="'tag-item-'+index">
          <div class="token-item-box" @mousedown="handleTokenMouseDown(index, $event)"
            @contextmenu="handleTokenContextMenu(index, $event)"
            @dblclick="toggleHidden(index, $event)" :style="{ backgroundColor: token.color }"
            :class="{
              'token-item-box-disabled': token.isHidden,
              'token-search-hit': isSearchHit(index),
              'token-search-dim': isSearchDim(index)
            }">

            <!-- 换行标记 -->
            <div v-if="token.text === '\n'" class="newline-token">
              <span class="token-symbol" :title="t('promptBox.newline')">↵</span>
            </div>

            <!-- Tab标记 -->
            <div v-else-if="token.text === '\t'" class="token-item tab-token" @mouseenter="showControls(index, $event)"
              @mouseleave="handleMouseLeave(index)">
              <span class="token-symbol" :title="t('promptBox.tab')">→</span>
            </div>

            <!-- 为Lora标签添加特殊图标 -->
            <div v-else-if="token.isLoraTag" class="lora-tag-icon" :title="t('promptBox.loraTag')"
              @mouseenter="showControls(index, $event)" @mouseleave="handleMouseLeave(index)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15">
                <path
                  d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
              </svg>
              <span style="margin-left: 5px;">{{ token.text }}</span>
            </div>

            <!-- 普通词组 -->
            <div v-else-if="token.text && !token.isLoraTag" class="token-item" @mouseenter="showControls(index, $event)"
              @mouseleave="handleMouseLeave(index)" :class="{
                'punctuation': token.isPunctuation
              }">
              <span v-if="!token.isEditing || token.isPunctuation"
                @click="!token.isPunctuation && startEditing(index)">{{
                  token.text }}</span>
              <input v-else-if="!token.isPunctuation" :value="token.text" @input="handleTokenEdit(index, $event)"
                @blur="finishEditing(index)" @keyup.enter="finishEditing(index)"
                :ref="el => { if (el) tokenInputRefs[index] = el }">
              <!-- 右侧快捷删除按钮 -->
              <button v-if="showDeleteButton" class="quick-delete-btn" @click.stop="deleteToken(index)"
                :title="t('promptBox.delete')" style="margin-left: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    fill="#ff4d4f70" />
                </svg>
              </button>
            </div>



            <!-- 翻译结果显示 -->
            <div class="translation-result" v-if="token.text !== '\n' && token.text !== '\t' && !token.isLoraTag">
              <div v-if="isTextTranslatable(token.text)" @click="translateFunction(token.text, token)"
                class="translate-button" :title="t('promptBox.translate')">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" class="token-item-icon" width="24"
                  height="24">
                  <path
                    d="M677.676657 294.6142c19.165116 57.5433 44.715939 102.2992 89.431879 147.0551 38.322239-38.3622 63.873063-89.5118 83.038178-147.0551h-172.470057z m-421.56861 319.685h166.076358l-83.038179-223.7795-83.038179 223.7795z"
                    p-id="2419"></path>
                  <path
                    d="M894.854661 0.504H128.353929C58.095158 0.504 0.607803 58.0473 0.607803 128.378v767.244c0 70.3307 57.487355 127.874 127.746126 127.874h766.500733c70.258771 0 127.746126-57.5433 127.746126-127.874V128.378c0-70.3307-51.101647-127.874-127.746126-127.874zM581.867062 825.2913c-12.771416 12.7874-25.550824 12.7874-38.322239 12.7874-6.3937 0-19.165116 0-25.550824-6.3937-6.3937-6.3937-12.779408 0-12.779408-6.3937s-6.385708-12.7874-12.771415-25.5748c-6.3937-12.7874-6.3937-19.1811-12.779408-31.9685l-25.542832-70.3307H230.557224L205.0064 767.748c-12.771416 25.5748-19.165116 44.7559-25.550824 57.5433-6.3937 12.7874-19.165116 12.7874-38.322239 12.7874-12.779408 0-25.550824-6.3937-38.330231-12.7874-12.771416-12.7874-19.157124-19.1811-19.157124-31.9685 0-6.3937 0-12.7874 6.385708-25.5748 6.3937-12.7874 6.3937-19.1811 12.771416-31.9685l140.525533-358.0472c6.3937-12.7874 6.3937-25.5748 12.779408-38.3622 6.385708-12.7874 12.771416-25.5748 19.157124-31.9685 6.3937-6.3937 12.779408-19.1811 25.550823-25.5748 12.779408-6.3937 25.550824-6.3937 38.330232-6.3937 12.771416 0 25.542832 0 38.322239 6.3937 12.771416 6.3937 19.165116 12.7874 25.550824 25.5748 6.385708 6.3937 12.771416 19.1811 19.157124 31.9685 6.3937 12.7874 12.779408 25.5748 19.165115 44.7559l140.525534 351.6535c12.771416 25.5748 19.165116 44.7559 19.165116 57.5433-6.3937 6.3937-12.779408 19.1811-19.165116 31.9685zM933.176901 575.937c-70.258771-25.5748-121.360418-57.5433-166.076358-95.9055-44.707947 44.7559-102.195302 76.7244-172.462065 95.9055l-19.157124-31.9685c70.258771-19.1811 127.746126-44.7559 172.462066-89.5118C703.22748 409.7008 664.905241 352.1575 652.125833 288.2205h-63.873063v-25.5748h172.470058c-12.7874-19.1811-25.558816-44.7559-38.330232-63.937l19.157124-6.3937c12.779408 19.1811 31.944524 44.7559 44.715939 70.3307h159.682658v31.9685h-63.873063c-19.157124 63.937-51.093655 121.4803-89.423887 159.8425 44.715939 38.3622 95.809594 70.3307 166.076358 89.5118l-25.550824 31.9685z"
                    p-id="2420"></path>
                </svg>
              </div>
              <span class="translated-text">{{ token.translate ? token.translate : '' }}</span>
            </div>
          </div>

          <!-- 如果是 换行，插入换行占位元素 -->
          <div v-if="token.text === '\n'" class="line-break"></div>
        </template>

        <!-- 拖拽插入位置指示线 -->
        <div v-show="dropIndicator.show" class="drop-indicator"
          :style="{ left: dropIndicator.x + 'px', top: dropIndicator.y + 'px', height: dropIndicator.height + 'px' }">
        </div>

      </div>

      <!-- 添加悬浮提示框 -->
      <div v-if="showTagTipsBox" class="tag-tips-box" :style="tagTipsPosition">
        <div class="tag-tips-content">
          <p v-html="t('promptBox.tagTips')"></p>
        </div>
      </div>

      <!-- 控制栏容器（隐藏用 opacity+pointer-events 而非 visibility：
           visibility 是继承属性，会被子按钮的 transition:all 过渡导致个别按钮延迟消失；
           opacity 不继承、不触发子元素过渡，整栏同帧消失。隐藏时仍渲染可测量尺寸） -->
      <div ref="controlsBarRef" class="token-controls" :class="{ 'is-lora': tokens[activeControls]?.isLoraTag }"
        :style="{
          top: controlsPosition.top,
          left: controlsPosition.left,
          opacity: (controlsVisible && activeControls !== null && tokens[activeControls]) ? 1 : 0,
          pointerEvents: (controlsVisible && activeControls !== null && tokens[activeControls]) ? 'auto' : 'none'
        }"
        @mouseenter="isOverControls = true" @mouseleave="handleControlsLeave">

        <!-- 普通Tag 添加权重输入框 -->
        <div class="weight-control" v-if="!tokens[activeControls]?.isLoraTag">
          <input type="number" v-model="weightValue" step="0.1" class="weight-input" @input="applyWeight"
            @wheel="adjustWeightByWheel($event, 'weight')">
          <span class="weight-label">{{ t('promptBox.weight') }}</span>
        </div>

        <!-- Lora 本地封面缩略图（无本地封面不渲染）；视频封面静默循环预览；点击打开 lora 详情窗 -->
        <video v-if="activeLoraCover && isVideoCover" :src="activeLoraCover" class="lora-cover-thumb"
          muted autoplay loop playsinline @click="openLoraDetailFromCover()"
          @mouseenter="showLoraCardFromCover" @mouseleave="scheduleHideCoverCard"></video>
        <img v-else-if="activeLoraCover" :src="activeLoraCover" class="lora-cover-thumb"
          @click="openLoraDetailFromCover()"
          @mouseenter="showLoraCardFromCover" @mouseleave="scheduleHideCoverCard">

        <!-- Lora标签的权重控制 -->
        <div class="lora-weight-controls" v-if="tokens[activeControls]?.isLoraTag">
          <div class="weight-control">
            <input type="number" v-model="loraModelWeight" step="0.1" class="weight-input" @input="onLoraModelWeightInput"
              @wheel="adjustWeightByWheel($event, 'loraModel')">
            <span class="weight-label">{{ t('promptBox.modelWeight') }}</span>
          </div>
          <div class="weight-control">
            <input type="number" v-model="loraTextWeight" step="0.1" class="weight-input" @input="onLoraTextWeightInput"
              @wheel="adjustWeightByWheel($event, 'loraText')">
            <span class="weight-label">{{ t('promptBox.textWeight') }}</span>
          </div>
        </div>

        <!-- 功能按钮容器：wlr 模式下作为 grid 第 3 行（按钮横排） -->
        <div class="controls-actions">
        <!-- 收藏按钮 -->
        <button class="favour-btn" @click="openFavourTag(tokens[activeControls])" :title="t('promptBox.favour')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              fill="#FFD700" />
          </svg>
        </button>

        <!-- 权重同步开关（仅 wlr）：开启后模型/文本权重联动 -->
        <button v-if="tokens[activeControls]?.isLoraTag" class="lora-sync-btn"
          :class="{ 'is-active': loraWeightSync }" @click="toggleLoraWeightSync" :title="t('promptBox.weightSync')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </button>

        <!-- 启用/禁用按钮（仅 wlr）：复用 isHidden 机制，与双击屏蔽一致；
             图标与框选操作菜单一致——启用中显示红⊘（点击禁用），禁用中显示绿✓（点击启用） -->
        <button v-if="tokens[activeControls]?.isLoraTag" class="lora-toggle-btn" @click="toggleHidden(activeControls, null)"
          :title="tokens[activeControls]?.isHidden ? t('promptBox.enableTag') : t('promptBox.disableTag')">
          <svg v-if="!tokens[activeControls]?.isHidden" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#ff4d4f" stroke-width="2" />
            <path d="M8.5 8.5l7 7" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="#52c41a">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </button>

        <!-- 翻译单个TAG按钮 -->
        <button v-if="!tokens[activeControls]?.isLoraTag" class="translate-tag-btn"
          @click="translateFunction(tokens[activeControls].text, tokens[activeControls])"
          :title="t('promptBox.translate')">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </button>

        <button @click="handleDelete" class="delete-btn" :title="t('promptBox.delete')">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div class="bracket-btn-group" v-if="!tokens[activeControls]?.isLoraTag">
          <div class="bracket-btn-container">
            <!-- 括号按钮 -->
            <div class="bracket-btn">
              ()
            </div>
            <!-- 加减号按钮组 -->
            <div class="vertical-btn-group">
              <button class="vertical-btn" @click="wrapWith('(')" :title="t('promptBox.addBracket')">
                +
              </button>
              <button class="vertical-btn" @click="removeLayer('(')" :title="t('promptBox.removeLayer')">
                -
              </button>
            </div>
          </div>

          <div class="bracket-btn-container">
            <div class="bracket-btn">
              []
            </div>
            <div class="vertical-btn-group">
              <button class="vertical-btn" @click="wrapWith('[')" :title="t('promptBox.addBracket')">
                +
              </button>
              <button class="vertical-btn" @click="removeLayer('[')" :title="t('promptBox.removeLayer')">
                -
              </button>
            </div>
          </div>

          <div class="bracket-btn-container">
            <div class="bracket-btn">
              {}
            </div>
            <div class="vertical-btn-group">
              <button class="vertical-btn" @click="wrapWith('{')" :title="t('promptBox.addBracket')">
                +
              </button>
              <button class="vertical-btn" @click="removeLayer('{')" :title="t('promptBox.removeLayer')">
                -
              </button>
            </div>
          </div>
        </div>

        <!-- 换行符按钮（仅普通模式：wlr 悬浮栏已移除该按钮） -->
        <button v-if="!tokens[activeControls]?.isLoraTag" class="line-token-btn" @click="handelLineToken" :title="t('promptBox.addLineToken')"
          style="margin-left: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 19h14v-2H5v2zm0-7h14v-2H5v2zm0-7v2h14V5H5z" fill="#888" />
            <path d="M7 17v-2h2v2H7zm0-7V8h2v2H7zm0-7V3h2v2H7z" fill="#4285f4" />
          </svg>
        </button>
        </div>
      </div>

      <!-- 悬停封面的 lora 信息浮窗（复用 LoraCard 悬浮卡片） -->
      <LoraCard class="wlr-cover-card" ref="coverCardRef" v-if="showCoverCard" :fileNmae="coverCardFile"
        :paddingLeft="coverCardPos.left" :paddingTop="coverCardPos.top"
        @cardLeave="hideCoverCard" @cardenter="keepCoverCard" @openDetail="openDetailFromCoverCard"
        @cover-updated="refreshLoraCoverForFile" />


      <!-- 自定义确认对话框 -->
      <div v-if="showConfirmDialog" class="weilin-confirm-dialog-overlay" @click="cancelConfirmDialog">
        <div class="weilin-confirm-dialog" @click.stop>
          <div class="weilin-confirm-dialog-header">
            <svg class="weilin-confirm-dialog-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ff4d4f"/>
              <circle cx="12" cy="12" r="10" fill="none" stroke="#ff4d4f" stroke-width="2"/>
              <path d="M12 7v6M12 17h.01" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="weilin-confirm-dialog-title">确认删除</span>
          </div>
          <div class="weilin-confirm-dialog-content">
            {{ confirmDialogMessage }}
          </div>
          <div class="weilin-confirm-dialog-footer">
            <button class="weilin-confirm-dialog-btn weilin-confirm-dialog-btn-cancel" @click="cancelConfirmDialog">
              取消
            </button>
            <button class="weilin-confirm-dialog-btn weilin-confirm-dialog-btn-confirm" @click="executeConfirmDialog">
              确定
            </button>
          </div>
        </div>
      </div>

      <!-- Lora管理器容器 -->
      <div class="tag-manager-section">

        <!-- 框选操作菜单 -->
        <div v-show="showSelectionActions" class="token-controls weilin-selection-actions-menu" :style="selectionActionsPosition"
          @mouseenter="isOverControls = true" @mouseleave="handleControlsLeave">
          <div class="weilin-comfyui-selection-actions-content">
            <div class="weilin-comfyui-selection-actions-count">{{ t('promptBox.selectedCount', { n: selectedTokens.length }) }}</div>
            <div class="weilin-comfyui-selection-actions-buttons">
              <button class="delete-btn copy-btn" @click="copySelectedTokens" title="复制">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </button>
              <button class="delete-btn sel-fav-btn" @click="favoriteSelectedTokens" title="收藏">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
              <button class="delete-btn" @click="disableSelectedTokens" title="禁用">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="#ff4d4f" stroke-width="2" />
                  <path d="M8.5 8.5l7 7" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
              <button class="delete-btn enable-btn" @click="enableSelectedTokens" title="启用">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </button>
              <button class="delete-btn" @click="deleteSelectedTokens" title="删除">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="tag-manager-header" @click="toggleTagManager">
          <div class="header-left">
            <svg class="tag-icon" viewBox="0 0 24 24">
              <path
                d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
            </svg>
            <span class="section-title">{{ t('controls.tagManager') }}</span>
          </div>
          <div class="header-right">
            <svg class="collapse-icon" :class="{ 'is-collapsed': !showTagManager }" viewBox="0 0 24 24">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          </div>
        </div>
        <div class="tag-manager-container" v-show="showTagManager">
          <TagManager />
        </div>
      </div>

      <!-- Lora管理器容器 -->
      <div class="tag-manager-section">
        <div class="tag-manager-header" @click="toggleLoraManager">
          <div class="header-left">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" class="tag-icon" width="24" height="24">
              <path
                d="M129 128h350v80H209v224h270v80H129V128zM129 895V576h768v319H129z m80-239v159h608V656H209zM730 356c19.882 0 36-16.118 36-36s-16.118-36-36-36-36 16.118-36 36 16.118 36 36 36z">
              </path>
              <path
                d="M578.517 214.386a32.002 32.002 0 0 0-16.01 27.731l0.058 155.918a31.998 31.998 0 0 0 16 27.701l135.156 78.033a32.002 32.002 0 0 0 31.99 0.006l135.058-77.909a32.002 32.002 0 0 0 16.01-27.731l-0.058-155.918a32 32 0 0 0-16-27.701l-135.157-78.033a31.998 31.998 0 0 0-31.989-0.005l-135.058 77.908z m67.002 58.058l84.033-48.591 84.181 48.715 0.034 95.24-84.034 48.591-84.18-48.714-0.034-95.241z">
              </path>
            </svg>
            <span class="section-title">{{ t('controls.loraManager') }}</span>
          </div>
          <div class="header-right">
            <svg class="collapse-icon" :class="{ 'is-collapsed': !showLoraManager }" viewBox="0 0 24 24">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          </div>
        </div>
        <div class="lora-manager-container" v-show="showLoraManager">
          <LoraManager :loraManager="'prompt_inner'" />
        </div>
      </div>

    </div>
  </div>

  <RandomSetting ref="randomSettingItem" />
  <favourItem ref="favourItemRef" />

  <!-- 快速收藏名称输入窗：名称由用户决定，确认后把当前提示词与已加载 Lora 存入收藏夹 -->
  <Dialog v-model="showQuickFavDialog" :title="t('controls.quickFavorite')" width="400px">
    <div class="quick-fav-form">
      <input type="text" v-model="quickFavName" class="quick-fav-name-input"
        :placeholder="t('history.dialog.name_placeholder')" @keydown.enter="confirmQuickFavorite" />
    </div>
    <template #footer>
      <button @click="showQuickFavDialog = false">{{ t('common.cancel') }}</button>
      <button @click="confirmQuickFavorite">{{ t('common.confirm') }}</button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch, onBeforeUpdate, onMounted, onUnmounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { isTrustedMessage } from '@/utils/post_message'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import SettingDialog from './components/setting_dialog.vue'
import ThemeSwitch from '@/components/ThemeSwitch.vue'
import TagManager from '@/view/tag_manager/tag_index.vue'  // 导入 TagManager 组件
import LoraStack from './components/lora_stack.vue'
import LoraCard from '@/view/lora_manager/lora_card.vue'
import { translatorApi } from '@/api/translator'
import { historyApi } from '@/api/history'
import { loraApi } from '@/api/lora'
import message from '@/utils/message'
import { autocompleteApi } from '@/api/autocomplete'
import LoraManager from "@/view/lora_manager/lora_index.vue"
import RandomSetting from './components/random_setting.vue'
import { randomTagApi } from '@/api/random_tag'
import pako from 'pako'
import favourItem from './components/favour.vue'
import Dialog from '@/components/Dialog.vue'

const randomSettingItem = ref(null)

const prefix = "weilin_prompt_ui_"
const { t } = useI18n()

// 主题开关按钮的文案：按三态显示
//  - follow：显示「跟随主题」（避免在跟随态下误导为"夜间/日间模式"）
//  - dark / light：显示对应强制档
const themeModeText = (mode, isDark) => {
  if (mode === 'follow') return t('controls.followTheme')
  return t(mode === 'dark' ? 'controls.darkMode' : 'controls.lightMode')
}

const autocompleteContainerRef = ref()
const inputAreaRef = ref()
const autocompletePosition = ref({ top: 0, left: 0 })

// 在data或ref部分添加
const tokenCount = ref(0)

const props = defineProps({
  promptManager: {
    type: String,
    default: 'prompt_global'
  },
  hasPromptLoraStack: {
    type: Boolean,
    default: false
  },
})

const parentCneterBox = ref(null)

// 输入prompt信息
const inputText = ref('')
const tokens = ref([])
const tokenInputRefs = {}
const activeControls = ref(null)
const isOverControls = ref(false)
const controlsPosition = ref({
  top: '0px',
  left: '0px'
})
const showLanguageSelector = ref(false)
const settingDialog = ref(null)
const langBtnRef = ref(null)
const languageSwitcherRef = ref(null)

// Lora选择信息
const selectedLoras = ref([])
const loraOpen = ref(false)

// ===== wlr 标签 ↔ lora 堆双向同步（文本新增→入堆、文本删除→出堆、权重实时互写）=====
// 文本是 wlr 标签的载体，堆与文本按名字对齐；防循环靠"上次同步快照"——写堆后立即更新
// 快照，堆 watcher 比较快照相同则不回写文本（syncingFromText 标志作同步期双保险）。
const wlrTagRegex = /^<wlr:([^:]+):([^:]+):([^>]+)>$/
let syncingFromText = false
let lastStackSnapshot = JSON.stringify([])
// 上次同步时文本里出现过的 wlr 名字集合：删除方向只作用于"上次有、这次没了"的名字，
// 避免误删管理器直接加入堆（文本无 wlr 标签）的条目。初始为空 → 首次同步不删任何东西
let lastWlrNames = new Set()

const stackSnapshot = () => JSON.stringify(selectedLoras.value.map(l => ({ n: l.name, w: l.weight, t: l.text_encoder_weight })))

// 从当前 tokens 提取完整 wlr 标签：name → {weight, text_encoder_weight}
const extractWlrTagsFromTokens = () => {
  const map = new Map()
  tokens.value.forEach(t => {
    if (t.isHidden || !t.isLoraTag) return
    const m = t.text.match(wlrTagRegex)
    if (m) {
      const w1 = parseFloat(m[2])
      const w2 = parseFloat(m[3])
      if (Number.isFinite(w1) && Number.isFinite(w2)) map.set(m[1], { weight: w1, text_encoder_weight: w2 })
    }
  })
  return map
}

// 文本 → 堆：在 tokens 重建后调用（防抖），保证堆如实反映当前文本
const syncWlrTagsWithStack = () => {
  const textTags = extractWlrTagsFromTokens()
  syncingFromText = true
  textTags.forEach((w, name) => {
    const entry = selectedLoras.value.find(l => l.name === name)
    if (!entry) {
      selectedLoras.value.push({
        name,
        display_name: name.replace(/\.(safetensors|pt|bin|ckpt)$/i, ''),
        // wlr 标签里的名字不含扩展名/子目录，直接当 file 查详情后端会 500（表现=网络错误）；
        // 优先用 check_lora_previews 已解析的真实相对路径，未返回时先用裸名（watcher 会补）
        lora: loraPathMap.value[name] || name,
        weight: w.weight,
        text_encoder_weight: w.text_encoder_weight,
        loraWorks: ''
      })
    } else {
      if (Number(entry.weight) !== w.weight) entry.weight = w.weight
      if (Number(entry.text_encoder_weight) !== w.text_encoder_weight) entry.text_encoder_weight = w.text_encoder_weight
    }
  })
  // 删除方向：只移除"上次在文本出现过、这次文本里没了"的 wlr 名字对应条目。
  // 不能简单地"堆有文本无就删"——管理器"添加到堆"会直接 push 进 selectedLoras 且文本
  // 并没有 wlr 标签，那样会被误删（表现为添加后条目立刻消失）。
  const textNames = new Set(textTags.keys())
  const removedNames = [...lastWlrNames].filter(n => !textNames.has(n))
  if (removedNames.length > 0) {
    selectedLoras.value = selectedLoras.value.filter(l => !removedNames.includes(l.name))
  }
  syncingFromText = false
  lastStackSnapshot = stackSnapshot()
  lastWlrNames = textNames
  prefetchLoraCoverImages(textTags)
}

// 堆 → 文本回写（堆 UI 改权重/删条目后）：反写文本 wlr 标签权重 / 移除已不在堆里的标签。
// 防抖 100ms：管理器"添加"会同时插标签+进堆（两条消息），合并窗口内只处理一次
let stackToTextTimer = null
const scheduleStackToText = () => {
  if (stackToTextTimer) clearTimeout(stackToTextTimer)
  stackToTextTimer = setTimeout(() => {
    stackToTextTimer = null
    applyStackToText()
  }, 100)
}

const applyStackToText = () => {
  let changed = false
  const removed = []
  tokens.value.forEach(t => {
    if (t.isHidden || !t.isLoraTag) return
    const m = t.text.match(wlrTagRegex)
    if (!m) return
    const entry = selectedLoras.value.find(l => l.name === m[1])
    if (!entry) {
      removed.push(t)
    } else if (Number(entry.weight) !== Number(m[2]) || Number(entry.text_encoder_weight) !== Number(m[3])) {
      t.text = `<wlr:${m[1]}:${entry.weight}:${entry.text_encoder_weight}>`
      changed = true
    }
  })
  if (removed.length > 0) {
    tokens.value = tokens.value.filter(t => !removed.includes(t))
    changed = true
  }
  if (changed) {
    updateInputText()
    finishPromptPutItHistory()
  }
}

// ===== wlr 标签封面缩略图（批量预查 + 缓存，无本地封面不显示）=====
const loraCoverMap = ref({}) // name → base64 dataURL | null（null=已查、无封面）
const loraPathMap = ref({})  // name → 解析后的真实相对路径（wlr 标签名不含扩展名，详情/悬浮卡片需要）
let loraCoverTimer = null

const prefetchLoraCoverImages = (textTags) => {
  const pending = [...textTags.keys()].filter(n => n && !(n in loraCoverMap.value))
  if (pending.length === 0) return
  if (loraCoverTimer) clearTimeout(loraCoverTimer)
  loraCoverTimer = setTimeout(() => {
    loraCoverTimer = null
    loraApi.checkLoraPreviews(pending)
      .then((res) => {
        const data = res?.data
        if (data && typeof data === 'object') {
          const filtered = {}
          Object.keys(data).forEach(k => {
            // 图片(data:image)与视频(data:video / fmt=mp4 URL)都可预览；其余按无封面处理
            const v = data[k]
            filtered[k] = (typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('data:video/') || v.includes('fmt=mp4'))) ? v : null
          })
          loraCoverMap.value = { ...loraCoverMap.value, ...filtered }
        }
        const paths = res?.paths
        if (paths && typeof paths === 'object') {
          loraPathMap.value = { ...loraPathMap.value, ...paths }
        }
      })
      .catch((e) => {
        // 诊断：后端新增 check_lora_previews 端点需重启 ComfyUI 才可用
        console.warn('[WeiLin] 获取 Lora 封面失败（端点需重启 ComfyUI？）:', e)
      })
  }, 150)
}

// 路径解析是异步的（check_lora_previews 返回后）：堆里仍挂着裸名的 wlr 条目在此补成真实路径，
// 同时覆盖历史持久化数据（收藏/标签的 temp_lora 可能存了裸名）。只补解析命中的条目；
// 管理器直接添加的条目 lora 本就是完整路径，不受影响
watch(loraPathMap, (map) => {
  if (!map || typeof map !== 'object') return
  selectedLoras.value.forEach(l => {
    const resolved = map[l.name]
    if (resolved && l.lora !== resolved) l.lora = resolved
  })
})

// 当前悬浮 wlr 标签的封面（无封面/未返回时不渲染）；视频封面用 <video> 静默循环预览
const activeLoraCover = computed(() => {
  if (activeControls.value === null) return ''
  const t = tokens.value[activeControls.value]
  if (!t || !t.isLoraTag) return ''
  const m = t.text.match(wlrTagRegex)
  if (!m) return ''
  return loraCoverMap.value[m[1]] || ''
})

const isVideoCover = computed(() => {
  const v = activeLoraCover.value
  return !!v && (v.startsWith('data:video/') || v.includes('fmt=mp4') || v.toLowerCase().endsWith('.mp4'))
})

// 当前悬浮 wlr 标签对应的 lora 真实路径（后端解析：wlr 标签里的 model_name 不含扩展名）
const activeLoraFile = computed(() => {
  if (activeControls.value === null) return ''
  const t = tokens.value[activeControls.value]
  if (!t || !t.isLoraTag) return ''
  const m = t.text.match(wlrTagRegex)
  if (!m) return ''
  return loraPathMap.value[m[1]] || m[1]
})

// 换封面后刷新 wlr 缩略图：loraCoverMap 是"查过就不再查"的缓存（prefetch 只取
// `!(n in loraCoverMap)` 的名字），不主动失效的话，管理器里换了封面、堆/悬停缩略图
// 仍一直显示旧图。这里删掉命中条目并重新预取：图片是 base64、视频是带 mtime 戳的
// URL，重取一次即拿到新封面。
const refreshLoraCoverForFile = (file) => {
  if (!file) return
  const norm = (s) => (s || '').replace(/\\/g, '/')
  const stem = (s) => norm(s).split('/').pop().replace(/\.(safetensors|pt|bin|ckpt)$/i, '')
  const target = norm(file)
  const targetStem = stem(file)
  const keys = Object.keys(loraCoverMap.value).filter(k =>
    norm(k) === target ||
    stem(k) === targetStem ||
    norm(loraPathMap.value[k] || '') === target
  )
  if (keys.length === 0) return
  const next = { ...loraCoverMap.value }
  keys.forEach(k => { delete next[k] })
  loraCoverMap.value = next
  prefetchLoraCoverImages(extractWlrTagsFromTokens())
}

// 从悬浮栏边界弹出位置（用户思路：弹窗一律从悬浮栏边界弹出，不用记忆位置）：
// 候选 = 悬浮栏左 / 悬浮栏右 / 悬浮栏下方 / 悬浮栏上方，逐个要求"完全在视口内 且 不与
// 悬浮栏相交"（候选用自然坐标生成，clamp 只在最终兜底），全不合格取相交面积最小的
const pickPositionFromBar = (cardWidth, cardHeight) => {
  const barRect = controlsBarRef.value ? controlsBarRef.value.getBoundingClientRect() : null
  const intersectsBar = (l, t) => {
    if (!barRect) return false
    return l < barRect.right && l + cardWidth > barRect.left && t < barRect.bottom && t + cardHeight > barRect.top
  }
  const overlapArea = (l, t) => {
    if (!barRect) return 0
    const w = Math.min(l + cardWidth, barRect.right) - Math.max(l, barRect.left)
    const h = Math.min(t + cardHeight, barRect.bottom) - Math.max(t, barRect.top)
    return w > 0 && h > 0 ? w * h : 0
  }
  const clampTop = (t) => Math.max(10, Math.min(t, window.innerHeight - cardHeight - 10))
  const clampLeft = (l) => Math.max(10, Math.min(l, window.innerWidth - cardWidth - 10))
  const bar = barRect || { left: 100, right: 500, top: 100, bottom: 200 }
  const candidates = [
    { left: bar.left - cardWidth - 10, top: bar.top },
    { left: bar.right + 10, top: bar.top },
    { left: bar.left, top: bar.bottom + 6 },
    { left: bar.left, top: bar.top - cardHeight - 6 }
  ]
  const inViewport = (p) => p.left >= 10 && p.left + cardWidth <= window.innerWidth - 10
    && p.top >= 10 && p.top + cardHeight <= window.innerHeight - 10
  let pick = candidates.find(p => inViewport(p) && !intersectsBar(p.left, p.top))
  if (!pick) {
    const usable = candidates.filter(inViewport)
    const pool = usable.length > 0 ? usable : candidates
    pick = pool.slice().sort((a, b) => overlapArea(a.left, a.top) - overlapArea(b.left, b.top))[0]
  }
  return { left: clampLeft(pick.left), top: clampTop(pick.top) }
}

// 点击封面打开 lora 详情窗（详情窗在主页面，走既有 openLoraDetail 消息链路）；
// 详情窗/信息浮窗存在期间钉住 wlr 悬浮栏（controlsPinned），不随鼠标离开自动消失
const controlsPinned = ref(false)
let loraDetailOpenedForCover = false // 详情窗经本入口打开且尚未被"悬停其他标签"复位
let pinnedTagIndex = null // 钉住所属的标签索引：showControls 只有悬停"其他"标签才解除钉住，
// 重新悬停同一标签不能解（否则详情窗开着时再悬停再移开，悬浮栏会消失——钉住被误释放）
const openLoraDetailFromCover = (file) => {
  // file 仅接受字符串路径；@click 直接绑定会把 MouseEvent 传入，必须排除（走 activeLoraFile 兜底）
  const f = (typeof file === 'string' && file) || activeLoraFile.value
  if (!f) return
  controlsPinned.value = true
  pinnedTagIndex = activeControls.value
  loraDetailOpenedForCover = true
  // 详情窗位置由主页面自身管理（App.vue openLoraDetail 忽略 position），不在此传
  window.parent.postMessage({ type: 'weilin_prompt_ui_openLoraDetail', lora: f }, '*')
}

// 浮窗内"详情"按钮（LoraCard openDetail 事件）：关闭浮窗 + 走封面同款详情链路
// （详情窗在主页面，postMessage；payload name 即 coverCardFile 的解析后路径）
const openDetailFromCoverCard = (data) => {
  const name = data?.name || data
  hideCoverCard()
  openLoraDetailFromCover(name)
}

// 悬停封面：显示 lora 信息浮窗（复用 LoraCard 悬浮卡片，定位逻辑同 lora 堆的 hover 卡片）
const showCoverCard = ref(false)
const coverCardFile = ref('')
const coverCardRef = ref(null)
const isEnterCoverCard = ref(false)
let coverCardTimer = null
const coverCardPos = ref({ left: 100, top: 0 })

watch(showCoverCard, (v) => {
  // 信息浮窗存在期间钉住悬浮栏；浮窗关闭后若详情窗不是打开状态则解除钉住，
  // 并重新走一次隐藏判定——鼠标可能在钉住期间就已离开标签（mouseleave 被钉住拦下），
  // 解除后若不主动判定，悬浮栏会永久留屏（这是"离开后不消失"的根因）
  if (v) {
    controlsPinned.value = true
    pinnedTagIndex = activeControls.value
  } else if (!loraDetailOpenedForCover) {
    controlsPinned.value = false
    pinnedTagIndex = null
    scheduleHideCheck()
  }
})
// 点击封面打开详情窗时置位（openLoraDetailFromCover）；详情窗关闭无法从 iframe 感知，
// 钉住保持到用户悬停其他标签（showControls 里解除）

const showLoraCardFromCover = (event) => {
  const file = activeLoraFile.value
  if (!file) return
  if (coverCardTimer) { clearTimeout(coverCardTimer); coverCardTimer = null }
  isEnterCoverCard.value = false
  // LoraCard 实际尺寸 520×400（.lora_catd_content 固定尺寸），从悬浮栏边界弹出：
  // 候选 = 悬浮栏左/右/下/上，要求不与悬浮栏相交且在视口内（pickPositionFromBar 已含兜底）
  coverCardPos.value = pickPositionFromBar(520, 400)
  coverCardFile.value = file
  showCoverCard.value = true
  nextTick(() => {
    coverCardRef.value?.refresh()
  })
}

const scheduleHideCoverCard = () => {
  setTimeout(() => {
    if (!isEnterCoverCard.value) {
      showCoverCard.value = false
      coverCardFile.value = ''
    }
  }, 200)
}
const keepCoverCard = () => { isEnterCoverCard.value = true }
const hideCoverCard = () => {
  isEnterCoverCard.value = false
  showCoverCard.value = false
  coverCardFile.value = ''
}

// 添加自动补全相关的 ref
const showAutocomplete = ref(false);
const autocompleteResults = ref([]);
const selectedAutocompleteIndex = ref(0);
const selectedItemRef = ref(null);
const saveAutoCompleteWidth = ref(localStorage.getItem('weilin_prompt_ui_auto_box_width') || 450);
const saveAutoCompleteHeight = ref(localStorage.getItem('weilin_prompt_ui_auto_box_height') || 350);


const translateText = ref('')

// 框选功能相关变量
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })
const selectedTokens = ref([])
const selectionBoxId = 'weilin-selection-box'
const tokensContainerRef = ref(null)
const isBoxSelectMode = ref(false) // 标记当前是否在框选模式
const isPotentialBoxSelection = ref(false) // 标记潜在的框选操作，用于区分点击和拖动
const showSelectionActions = ref(false)
const selectionActionsPosition = ref({ top: '0px', left: '0px' })
// 用于防止更新操作频繁触发的标志
const isUpdatingSelectionBox = ref(false) // 控制选择框更新
const isUpdatingSelectedTokens = ref(false) // 控制标签选中状态更新
// 用于节流的时间戳
const lastUpdateTime = ref(0)
const throttleInterval = 16 // 约60fps

const showTagTipsBox = ref(false);
const tagTipsPosition = ref({
  top: '0px',
  left: '0px'
});

// 控制标签删除按钮是否显示的状态
const showDeleteButton = ref(localStorage.getItem('weilin_prompt_ui_show_delete_button') !== 'false');

// 保存删除按钮设置到localStorage
const saveShowDeleteButtonSetting = () => {
  localStorage.setItem('weilin_prompt_ui_show_delete_button', String(showDeleteButton.value));
};

// 切换删除按钮显示状态
const toggleDeleteButton = () => {
  showDeleteButton.value = !showDeleteButton.value;
  saveShowDeleteButtonSetting();
};

// 监听删除按钮设置的变化
const handleStorageChange = (e) => {
  if (e.key === 'weilin_prompt_ui_show_delete_button') {
    showDeleteButton.value = e.newValue !== 'false';
  }
};

// 组件挂载时添加监听器
onMounted(() => {
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('storage', handleFunctionTogglesStorageChange);
});

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
  window.removeEventListener('storage', handleFunctionTogglesStorageChange);
});


// 添加防抖相关的变量
const debounceTimeout = ref(null); // 用于存储 setTimeout 的 ID
const proceTimeout = ref(null);
const lastInputValue = ref(''); // 用于存储上一次的输入内容

// 在data或ref部分添加一个计数器用于生成唯一ID
const tokenIdCounter = ref(0);

const showConfirmDialog = ref(false)
const confirmDialogMessage = ref('')
let confirmDialogCallback = null


// 功能开关状态变量 - 从localStorage读取初始值，默认值都为true
const isClearAllEnabled = ref(localStorage.getItem('weilin_function_toggles_clearAll') !== 'false');
const isDeleteButtonEnabled = ref(localStorage.getItem('weilin_function_toggles_deleteButton') !== 'false');
const isRandomTagEnabled = ref(localStorage.getItem('weilin_function_toggles_randomTag') !== 'false');
const isRandomTagSettingsEnabled = ref(localStorage.getItem('weilin_function_toggles_randomTagSettings') !== 'false');
const isTranslateTagEnabled = ref(localStorage.getItem('weilin_function_toggles_translateTag') !== 'false');
const isClearDisabledEnabled = ref(localStorage.getItem('weilin_function_toggles_clearDisabled') !== 'false');
// 屏蔽 auto_random：只影响节点上的 auto_random 控件，不影响工具栏随机标签按钮，默认关闭
const isDisableAutoRandom = ref(localStorage.getItem('weilin_function_toggles_disableAutoRandom') === 'true');

// 监听功能开关变化并保存到 localStorage
watch([isClearAllEnabled, isDeleteButtonEnabled, isRandomTagEnabled, isRandomTagSettingsEnabled, isTranslateTagEnabled, isClearDisabledEnabled, isDisableAutoRandom],
  ([clearAll, deleteButton, randomTag, randomTagSettings, translateTag, clearDisabled, disableAutoRandom]) => {
    localStorage.setItem('weilin_function_toggles_clearAll', String(clearAll));
    localStorage.setItem('weilin_function_toggles_deleteButton', String(deleteButton));
    localStorage.setItem('weilin_function_toggles_randomTag', String(randomTag));
    localStorage.setItem('weilin_function_toggles_randomTagSettings', String(randomTagSettings));
    localStorage.setItem('weilin_function_toggles_translateTag', String(translateTag));
    localStorage.setItem('weilin_function_toggles_clearDisabled', String(clearDisabled));
    localStorage.setItem('weilin_function_toggles_disableAutoRandom', String(disableAutoRandom));
  }
);

// 监听功能开关设置的存储变化
const handleFunctionTogglesStorageChange = (e) => {
  if (e.key === 'weilin_function_toggles_clearAll') {
    isClearAllEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_deleteButton') {
    isDeleteButtonEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_randomTag') {
    isRandomTagEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_randomTagSettings') {
    isRandomTagSettingsEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_translateTag') {
    isTranslateTagEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_clearDisabled') {
    isClearDisabledEnabled.value = e.newValue !== 'false';
  } else if (e.key === 'weilin_function_toggles_disableAutoRandom') {
    isDisableAutoRandom.value = e.newValue === 'true';
    // 立即把新状态同步到页面上的节点（无需刷新）
    try {
      window.parent.postMessage({ type: 'weilin_prompt_ui_auto_random_toggle' }, '*');
    } catch (err) { /* 忽略跨域异常 */ }
  }
};

// 生成唯一ID的函数
const generateUniqueId = () => {
  tokenIdCounter.value++;
  return `token_${tokenIdCounter.value}_${Date.now()}`;
};

const toggleLora = () => {
  loraOpen.value = !loraOpen.value
}

const closeLora = () => {
  loraOpen.value = false
}

const mainContentWidth = computed(() => {
  const left = (loraOpen.value ? 300 : 0);
  return `calc(100% - ${left}px)`;
});


const openSettings = () => {
  settingDialog.value.toggle()
}

// 在 script 中添加相关方法
const weightValue = ref(1);

const applyWeight = () => {
  if (activeControls.value === null) return;

  // 实时更新时输入框可能处于中间态（空 / 负号 / "1." 等），跳过无效值避免破坏文本
  if (weightValue.value === '' || !Number.isFinite(Number(weightValue.value))) return;

  const token = tokens.value[activeControls.value];
  let text = token.text;

  // 检查括号是否完整
  if (!isBracketComplete(text)) {
    message({ type: "warn", str: 'message.noFinishKuo' });
    return;
  }

  // 辅助函数：检查是否只有一层圆括号
  const hasOnlySingleParentheses = (text) => {
    return text.startsWith('(') && text.endsWith(')') &&
      !text.slice(1, -1).includes('(') &&
      !text.slice(1, -1).includes(')') &&
      !text.slice(1, -1).includes('[') &&
      !text.slice(1, -1).includes(']') &&
      !text.slice(1, -1).includes('{') &&
      !text.slice(1, -1).includes('}') &&
      !text.slice(1, -1).includes('<') &&
      !text.slice(1, -1).includes('>');
  };

  // 辅助函数：查找文本中的现有权重值
  const getExistingWeight = (text) => {
    const weightMatch = text.match(/:(-?\d+(\.\d+)?)$/); // 支持负数
    return weightMatch ? parseFloat(weightMatch[1]) : null;
  };

  // 辅助函数：从嵌套括号中提取最内层内容
  const extractInnerContent = (text) => {
    // 查找最内层的内容，不包括权重
    const innerMatch = text.match(/^([\(\[\{\<]*)(.*?)(?::[\d.]+)?([\)\]\}\>]*)$/);
    if (!innerMatch) return text;

    let [, outerBrackets, content, outerCloseBrackets] = innerMatch;

    // 如果内容中还有括号，递归处理
    if (/[\(\[\{\<].*[\)\]\}\>]/.test(content) && !content.includes('\\(') && !content.includes('\\)')) {
      const innerContent = extractInnerContent(content);
      return outerBrackets + innerContent + outerCloseBrackets;
    }

    return content;
  };

  // 主要处理逻辑
  let newText = text;

  // 检查是否整个文本已经有权重值（在末尾）
  const hasTrailingWeight = /:(-?\d+(\.\d+)?)$/.test(text);

  // 检查是否已经是带权重的格式：(内容:权重)
  const weightedFormatMatch = text.match(/^\((.*?):(-?\d+(\.\d+)?)\)$/);

  if (hasTrailingWeight || weightedFormatMatch) {
    // 已经有权重的情况
    if (weightValue.value === 1) {
      // 权重为1时，移除权重标记和外层括号（如果有）
      if (text.startsWith('(') && text.endsWith(')')) {
        // 移除外层括号和权重
        newText = text.slice(1, -1).replace(/:(\d+(\.\d+)?)$/, '');
      } else {
        // 只有权重，没有外层括号，仅移除权重
        newText = text.replace(/:(\d+(\.\d+)?)$/, '');
      }
    } else {
      // 权重不为1，替换权重值
      // 确保只替换最外层的权重，不影响内部括号中的权重
      if (weightedFormatMatch) {
        // 完整的(内容:权重)格式
        newText = `(${weightedFormatMatch[1]}:${weightValue.value})`;
      } else {
        // 只有末尾有权重
        newText = text.replace(/:(-?\d+(\.\d+)?)$/, `:${weightValue.value}`);;
      }
    }
  } else {
    // 处理没有权重的情况

    // 处理ask_(askzy)格式 -> (ask (askzy):1.1)
    const underscoreBracketMatch = text.match(/^([^_]+)_(\([^)]+\))$/);
    if (underscoreBracketMatch && !text.includes('\\(') && !text.includes('\\)')) {
      const [, prefix, bracketContent] = underscoreBracketMatch;
      if (weightValue.value === 1) {
        newText = text; // 权重为1时保持原样
      } else {
        newText = `(${prefix} ${bracketContent}:${weightValue.value})`;
      }
    }
    // 处理ask_\(askzy\)格式 -> (ask_\(askzy\):1.1)
    else if (text.includes('\\(') && text.includes('\\)') && !/[\(\)\[\]\{\}<>]/.test(text.replace(/\\[\(\)\[\]\{\}<>]/g, ''))) {
      if (weightValue.value === 1) {
        newText = text; // 权重为1时保持原样
      } else {
        // 检查是否已经有外层括号
        if (text.startsWith('(') && text.endsWith(')')) {
          newText = text.replace(/\)$/, `:${weightValue.value})`);
        } else {
          newText = `(${text}:${weightValue.value})`;
        }
      }
    }
    // 处理没有任何括号的情况
    else if (!/[\(\[\{\<\)\]\}\>]/.test(text)) {
      if (weightValue.value === 1) {
        newText = text; // 权重为1时保持原样
      } else {
        newText = `(${text}:${weightValue.value})`;
      }
    }
    // 处理只有一层圆括号的情况，权重为1时移除括号
    else if (weightValue.value === 1 && hasOnlySingleParentheses(text)) {
      newText = text.slice(1, -1);
    }
    // 处理包含内部括号的情况，确保权重调整应用于整个文本
    else {
      if (weightValue.value === 1) {
        // 权重为1时，保持原样
        newText = text;
      } else {
        // 检查文本是否已经被括号包裹
        if (text.startsWith('(') && text.endsWith(')')) {
          // 已经有圆括号包裹，直接在末尾添加权重
          newText = text.replace(/\)$/, `:${weightValue.value})`);
        } else {
          // 添加圆括号并在内部末尾添加权重
          newText = `(${text}:${weightValue.value})`;
        }
      }
    }
  }

  tokens.value[activeControls.value].text = newText;
  updateInputText();
};


// Lora权重控制
const loraModelWeight = ref(0.5);
const loraTextWeight = ref(0.5);

// 当选择一个Lora标签时，解析其权重
watch(activeControls, (newVal) => {
  if (newVal !== null && tokens.value[newVal]?.isLoraTag) {
    // 解析Lora标签格式 <wlr:LoraName:weight1:weight2>
    const text = tokens.value[newVal].text;
    const match = text.match(/<wlr:([^:]+):([^:]+):([^>]+)>/);
    if (match) {
      loraModelWeight.value = parseFloat(match[2]);
      loraTextWeight.value = parseFloat(match[3]);
    }
  }
});

// 应用Lora权重
const applyLoraWeights = () => {
  // 实时更新时跳过中间态无效值（空 / 负号 / 小数点过程值），避免生成错误标签
  if (loraModelWeight.value === '' || !Number.isFinite(Number(loraModelWeight.value))) return;
  if (loraTextWeight.value === '' || !Number.isFinite(Number(loraTextWeight.value))) return;

  if (activeControls.value !== null && tokens.value[activeControls.value]?.isLoraTag) {
    const token = tokens.value[activeControls.value];
    const match = token.text.match(/<wlr:([^:]+):([^:]+):([^>]+)>/);
    if (match) {
      const loraName = match[1];
      // 创建新的Lora标签文本
      const newText = `<wlr:${loraName}:${loraModelWeight.value}:${loraTextWeight.value}>`;
      // 更新token文本
      token.text = newText;
      // 更新输入文本
      updateInputText();
    }
  }
};

// ============ 权重同步开关（wlr 悬浮栏） ============
// 每个 wlr lora 独立记忆（键 = 归一化名：去路径/后缀），与 lora堆 卡片的 sync_weights 双向同步：
// 悬浮栏切换 → 广播 set_sync 给 lora堆；lora堆卡片切换 → 广播 sync_changed 回来更新本端 map
const wlrKey = (s) => String(s || '').replace(/\\/g, '/').split('/').pop().replace(/\.(safetensors|pt|sft|ckpt|lora)$/i, '');
const loraSyncMap = ref((() => {
  try { return JSON.parse(localStorage.getItem('weilin_prompt_ui_lora_weight_sync_map') || '{}') } catch (e) { return {} }
})());
const persistLoraSyncMap = () => localStorage.setItem('weilin_prompt_ui_lora_weight_sync_map', JSON.stringify(loraSyncMap.value));
// 当前悬浮栏对应的 wlr lora 名（token 文本第一段）
const activeWlrName = computed(() => {
  const token = tokens.value[activeControls.value];
  if (!token?.isLoraTag) return '';
  const m = token.text.match(/<wlr:([^:]+):[^:]*:[^>]*>/);
  return m ? m[1] : '';
});
const loraWeightSync = computed({
  get: () => !!loraSyncMap.value[wlrKey(activeWlrName.value)],
  set: (v) => {
    loraSyncMap.value = { ...loraSyncMap.value, [wlrKey(activeWlrName.value)]: v };
    persistLoraSyncMap();
  }
});
const toggleLoraWeightSync = () => {
  loraWeightSync.value = !loraWeightSync.value;
  // lora堆窗口里同名卡片的权重同步开关跟着切换
  window.postMessage({ type: 'weilin_prompt_ui_lora_stack_set_sync', lora: activeWlrName.value, value: loraWeightSync.value }, '*');
  // 开启瞬间立即对齐：文本权重向模型权重看齐
  if (loraWeightSync.value) {
    syncLoraWeights('model');
    applyLoraWeights();
  }
};
// 把 source 权重同步给另一个；源值处于中间态（空/非有限数）时跳过，避免互相污染；
// 同步写入归一化数字（'0.' -> '0'），避免过程值原样污染另一输入框
const syncLoraWeights = (source) => {
  if (!loraWeightSync.value) return;
  const src = source === 'model' ? loraModelWeight.value : loraTextWeight.value;
  if (src === '' || !Number.isFinite(Number(src))) return;
  const norm = String(Number(src));
  if (source === 'model') loraTextWeight.value = norm;
  else loraModelWeight.value = norm;
};
const onLoraModelWeightInput = () => { syncLoraWeights('model'); applyLoraWeights(); };
const onLoraTextWeightInput = () => { syncLoraWeights('text'); applyLoraWeights(); };


// 修改wrapWith函数
const wrapWith = (bracketType) => {
  if (activeControls.value === null) return;

  const token = tokens.value[activeControls.value];
  let text = token.text;

  // 定义括号对
  const bracketPair = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>'
  }[bracketType];

  text = `${bracketType}${text}${bracketPair}`;

  tokens.value[activeControls.value].text = text;

  finishPromptPutItHistory();
};

const removeLayer = (bracketType) => {
  if (activeControls.value === null) return;
  const token = tokens.value[activeControls.value];
  let text = token.text;

  // 移除最外层对应类型的括号
  const bracketPair = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>'
  };

  if (text.startsWith(bracketType) && text.endsWith(bracketPair[bracketType])) {
    text = text.slice(1, -1);
    tokens.value[activeControls.value].text = text;
    finishPromptPutItHistory();
  }
};

// 添加括号完整性检查函数
const isBracketComplete = (text) => {
  const stack = [];
  const bracketMap = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>'
  };

  for (let char of text) {
    if (bracketMap[char]) {
      stack.push(char);
    } else if (Object.values(bracketMap).includes(char)) {
      if (stack.length === 0 || bracketMap[stack.pop()] !== char) {
        return false;
      }
    }
  }

  return stack.length === 0;
};

const getClosingBracket = (bracketType) => {
  switch (bracketType) {
    case '(': return ')';
    case '[': return ']';
    case '{': return '}';
    default: return '';
  }
};


// 在更新前清除 refs
onBeforeUpdate(() => {
  for (const key in tokenInputRefs) {
    delete tokenInputRefs[key]
  }
})

// 添加判断是否为标点符号的函数
const isPunctuation = (char) => {
  // 匹配中文标点和英文标点
  return /[\u2000-\u206F\u3000-\u303F\uFF00-\uFFEF!-/:-@\[-`{-~]/.test(char);
};

// 添加判断是否为英文的函数
const isEnglish = (text) => {
  return /^[a-zA-Z]+$/.test(text);
};
// 添加选择分割方式的变量
const splitByPunctuation = ref(true); // 默认以标点符号分割
const replaceUnderscoreWithSpace = ref(false); // 默认不替换下划线

const isTextTranslatable = (text) => {
  // 匹配包含任何语言的字母或字符
  // 包括但不限于：中文、英文、日文、韩文、阿拉伯文、俄文等
  // 排除纯数字、标点符号和特殊符号
  return /[\p{L}]/u.test(text);
};

const extractText = (input) => {
  // 匹配任意字符序列，直到遇到冒号
  const match = input.match(/([^:]+):[\d.]+/);
  // 如果找到了匹配项，则返回第一个捕获组，否则返回原输入
  return match ? match[1] : input;
}

const replaceTagsWithDesc = (text, tagMap) => {
  // 确保 tagMap 是 Map 类型
  if (!(tagMap instanceof Map)) {
    throw new Error("tagMap 必须是 Map 类型");
  }

  // 将所有 tag 拼接成一个正则表达式
  const tagsPattern = Array.from(tagMap.keys())
    .map(tag => {
      // 确保 tag 是字符串
      const tagStr = typeof tag === 'string' ? tag : String(tag);
      // 转义正则表达式的特殊字符
      return tagStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    })
    .join('|'); // 用 | 连接所有 tag

  // 创建全局不区分大小写的正则表达式
  const regex = new RegExp(tagsPattern, 'gi');

  // 使用 replace 和回调函数进行一次性替换
  return text.replace(regex, matchedTag => {
    // 查找对应的 desc
    const tagInfo = tagMap.get(matchedTag.toLowerCase()); // 假设不区分大小写
    return tagInfo ? tagInfo.desc : matchedTag; // 如果找不到 desc，返回原 tag
  });
};


let debounceTimer = null;
const calculateAutocompletePosition = async () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(async () => {
    if (!inputAreaRef.value) return;

    const textarea = inputAreaRef.value;
    const cursorPos = textarea.selectionStart;
    // console.log(textarea,cursorPos)

    // 确保自动补全窗口已经渲染
    await nextTick();

    // 创建镜像元素计算光标位置
    const text = textarea.value.substring(0, cursorPos);
    const mirror = document.createElement('div');
    mirror.style.position = 'absolute';
    mirror.style.top = '0';
    mirror.style.left = '0';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.width = window.getComputedStyle(textarea).width;
    mirror.style.font = window.getComputedStyle(textarea).font;
    mirror.style.padding = window.getComputedStyle(textarea).padding;

    const textNode = document.createTextNode(text);
    const cursorNode = document.createElement('span');
    cursorNode.textContent = '|';

    mirror.appendChild(textNode);
    mirror.appendChild(cursorNode);
    textarea.parentNode.appendChild(mirror);

    // 获取光标相对于父容器的位置
    const cursorRect = cursorNode.getBoundingClientRect();
    const parentRect = textarea.parentNode.getBoundingClientRect();

    // 计算初始位置
    let top = cursorRect.top - parentRect.top + cursorRect.height;
    let left = cursorRect.left - parentRect.left;

    // 等待DOM更新完成
    await nextTick();

    if (autocompleteContainerRef.value) {
      const autocompleteWidth = autocompleteContainerRef.value.offsetWidth;
      const textareaWidth = textarea.offsetWidth;
      const textareaLeft = textarea.getBoundingClientRect().left - parentRect.left;

      // 检查右边界
      if (left + autocompleteWidth > textareaLeft + textareaWidth) {
        left = textareaLeft + textareaWidth - autocompleteWidth;
      }

      // 检查左边界
      if (left < textareaLeft) {
        left = textareaLeft;
      }

      // 确保不会超出父容器
      left = Math.max(0, Math.min(left, parentRect.width - autocompleteWidth));
    }

    // 清理临时元素
    textarea.parentNode.removeChild(mirror);

    autocompletePosition.value = { top, left };
    debounceTimer = null;
  }, 50); // 50ms防抖
};

// 添加一个 ref 用于存储定时器
const historyTimer = ref(null);


// 处理输入事件
const handleInput = (event) => {
  if (!event?.target) return;

  if (!inputAreaRef.value) return

  // 获取原始输入值和光标位置
  const originalValue = event.target.value;
  const cursorPosition = event.target.selectionStart;
  const cursorEnd = event.target.selectionEnd;


  // 1. 首先处理格式转换
  const formatConversions = {
    comma: { enabled: localStorage.getItem('weilin_prompt_ui_comma_conversion') !== 'false', pattern: /，/g, replace: ',' },
    period: { enabled: localStorage.getItem('weilin_prompt_ui_period_conversion') !== 'false', pattern: /。/g, replace: '.' },
    bracket: {
      enabled: localStorage.getItem('weilin_prompt_ui_bracket_conversion') !== 'false', patterns: [
        { pattern: /【/g, replace: '[' },
        { pattern: /】/g, replace: ']' },
        { pattern: /（/g, replace: '(' },
        { pattern: /）/g, replace: ')' }
      ]
    },
    angleBracket: {
      enabled: localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion') !== 'false', patterns: [
        { pattern: /《/g, replace: '<' },
        { pattern: /》/g, replace: '>' }
      ]
    }
    // 下划线转换已移至补全确认时执行
  };

  // 记录每个替换操作前光标位置的字符
  let beforeCursor = originalValue.substring(0, cursorPosition);
  let processedValue = originalValue;

  // 应用所有转换
  Object.values(formatConversions).forEach(conversion => {
    if (conversion.enabled) {
      if (conversion.pattern) {
        // 处理单个模式的替换
        beforeCursor = beforeCursor.replace(conversion.pattern, conversion.replace);
        processedValue = processedValue.replace(conversion.pattern, conversion.replace);
      } else if (conversion.patterns) {
        // 处理多个模式的替换
        conversion.patterns.forEach(({ pattern, replace }) => {
          beforeCursor = beforeCursor.replace(pattern, replace);
          processedValue = processedValue.replace(pattern, replace);
        });
      }
    }
  });

  // 2. 直接更新输入框值
  inputText.value = processedValue;

  // 3. 立即计算并设置新的光标位置
  // 使用转换后的beforeCursor长度作为新的光标位置
  const newCursorPosition = beforeCursor.length;
  const selectionDiff = cursorEnd - cursorPosition;
  const newCursorEnd = newCursorPosition + selectionDiff;

  // 确保DOM更新后立即设置光标位置
  nextTick(() => {
    if (inputAreaRef.value) {
      inputAreaRef.value.setSelectionRange(newCursorPosition, newCursorEnd);
      // 确保输入框获得焦点
      inputAreaRef.value.focus();
    }
  });

  // 4. 精确获取当前输入内容用于补全
  const textBeforeCursor = processedValue.substring(0, newCursorPosition);

  // 检查是否启用了逗号关闭补全窗口功能
  const isCommaCloseAutocompleteEnabled = localStorage.getItem('weilin_prompt_ui_comma_close_autocomplete') === 'true';

  // 检查是否刚刚输入了逗号或空格
  const lastChar = newCursorPosition > 0 ? textBeforeCursor[newCursorPosition - 1] : '';
  const justTypedDelimiter = lastChar === ',' || lastChar === ' ';

  // 如果输入了逗号或空格，并且启用了该功能，立即关闭补全列表
  if (justTypedDelimiter && isCommaCloseAutocompleteEnabled) {
    showAutocomplete.value = false;
    // 防抖处理 - 用于在逗号或空格后开始输入新内容时触发补全
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value);
    }
    debounceTimeout.value = setTimeout(() => {
      // 获取当前光标位置
      const currentCursorPos = inputAreaRef.value?.selectionStart || 0;
      const currentText = inputText.value || '';
      const textBeforeCursor = currentText.substring(0, currentCursorPos);

      // 查找当前单词起始位置
      let wordStart = currentCursorPos;
      while (wordStart > 0 && !/[,\s]/.test(textBeforeCursor[wordStart - 1])) {
        wordStart--;
      }

      const currentWord = textBeforeCursor.substring(wordStart, currentCursorPos).trim();

      // 触发自动补全
      if (currentWord) {
        triggerAutocomplete(currentWord);
      }
      postMessageToWindowsPrompt();
    }, 300);
    // 计算token数量
    tokenCount.value = calculateTokens(inputText.value);
    return;
  }

  // 查找当前输入的单词起始位置
  let wordStart = newCursorPosition;
  while (wordStart > 0 && !/[,\s]/.test(textBeforeCursor[wordStart - 1])) {
    wordStart--;
  }


  const currentWord = textBeforeCursor.substring(wordStart, newCursorPosition).trim();

  // 5. 防抖处理
  if (debounceTimeout.value) {
    clearTimeout(debounceTimeout.value);
  }

  debounceTimeout.value = setTimeout(() => {
    if (currentWord) {
      triggerAutocomplete(currentWord);
    }
    postMessageToWindowsPrompt();
  }, 300);

  // 计算token数量（简单实现，可根据实际分词算法调整）
  tokenCount.value = calculateTokens(inputText.value)
};


// 添加计算token的方法
const calculateTokens = (text) => {
  if (!text) return 0
  // 简单实现：按空格分词
  // 注意：实际的token计算应该使用与您模型匹配的分词器
  return text.trim().split(/\s+/).length
}

// 处理输入事件 ========== 主事件处理 ==========
const processInput = async () => {

  // 预设设置（下划线转换不在此处理：只在补全确认插入时执行）
  let isCommaConversionEnabled = localStorage.getItem('weilin_prompt_ui_comma_conversion') === 'true';
  let isPeriodConversionEnabled = localStorage.getItem('weilin_prompt_ui_period_conversion') === 'true';
  let isBracketConversionEnabled = localStorage.getItem('weilin_prompt_ui_bracket_conversion') === 'true';
  let isAngleBracketConversionEnabled = localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion') === 'true';

  if (!localStorage.getItem('weilin_prompt_ui_comma_conversion')) {
    localStorage.setItem('weilin_prompt_ui_comma_conversion', 'true')
    isCommaConversionEnabled = true
  }
  if (!localStorage.getItem('weilin_prompt_ui_period_conversion')) {
    localStorage.setItem('weilin_prompt_ui_period_conversion', 'true')
    isPeriodConversionEnabled = true
  }
  if (!localStorage.getItem('weilin_prompt_ui_bracket_conversion')) {
    localStorage.setItem('weilin_prompt_ui_bracket_conversion', 'true')
    isBracketConversionEnabled = true
  }
  if (!localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion')) {
    localStorage.setItem('weilin_prompt_ui_angle_bracket_conversion', 'true')
    isAngleBracketConversionEnabled = true
  }


  if (isCommaConversionEnabled) {
    inputText.value = inputText.value.replace(/，/g, ',');
  }
  if (isPeriodConversionEnabled) {
    inputText.value = inputText.value.replace(/。/g, '.');
  }
  if (isBracketConversionEnabled) {
    inputText.value = inputText.value
      .replace(/【/g, '[')  // 中文左方括号
      .replace(/】/g, ']')  // 中文右方括号
      .replace(/（/g, '(')  // 中文左圆括号
      .replace(/）/g, ')'); // 中文右圆括号
  }
  if (isAngleBracketConversionEnabled) {
    // 替换中文书名号为英文尖括号
    inputText.value = inputText.value
      .replace(/《/g, '<')  // 中文左书名号
      .replace(/》/g, '>'); // 中文右书名号
  }

  // 下划线转空格的逻辑已移至补全确认时执行

  // 处理文本分割
  const text = inputText.value;
  let segments = [];

  // 首先记录所有隐藏token的原始位置
  const hiddenTokensWithOriginalIndex = tokens.value
    .map((token, originalIndex) => ({
      token,
      originalIndex,  // 保存原始绝对位置
      currentIndex: originalIndex  // 初始时currentIndex与originalIndex相同
    }))
    .filter(({ token }) => token.isHidden);

  // 递归函数处理嵌套括号
  const parseNestedBrackets = (str, startIndex = 0) => {
    let segments = [];
    let i = startIndex;
    let buffer = '';
    let bracketStack = [];

    while (i < str.length) {
      const char = str[i];

      // 处理开括号
      // if ('([{<'.includes(char)) {
      //   // 检测前一个字符是否是逗号或空格，或者是否是字符串开头
      //   const prevChar = i > 0 ? str[i - 1] : '';
      //   const isValidStart = prevChar === '' || prevChar === ',' || prevChar === ' ';

      //   if (isValidStart) {
      //     if (bracketStack.length === 0 && buffer.trim()) {
      //       // 如果这是第一层括号且缓冲区不为空，按逗号分割并添加
      //       segments.push(...buffer.split(',').filter(Boolean).map(s => s.trim()));
      //       buffer = '';
      //     }
      //     bracketStack.push(char);
      //     buffer += char;
      //   } else {
      //     // 如果不是有效开始，按普通字符处理
      //     buffer += char;
      //   }
      // }
      // // 处理闭括号
      // else if (')]}>'.includes(char)) {
      //   const lastBracket = bracketStack[bracketStack.length - 1];
      //   if (('(' === lastBracket && ')' === char) ||
      //     ('[' === lastBracket && ']' === char) ||
      //     ('{' === lastBracket && '}' === char) ||
      //     ('<' === lastBracket && '>' === char)) {

      //     // 只有在存在对应的开括号时才进行后续检测
      //     if (bracketStack.length > 0) {
      //       // 检测后一个字符是否是逗号或空格，或者是否是字符串结尾
      //       const nextChar = i < str.length - 1 ? str[i + 1] : '';
      //       const isValidEnd = nextChar === '' || nextChar === ',' || nextChar === ' ';

      //       if (isValidEnd) {
      //         bracketStack.pop();
      //         buffer += char;

      //         // 如果括号全部匹配完成，添加整个括号内容
      //         if (bracketStack.length === 0) {
      //           segments.push(buffer.trim());
      //           buffer = '';
      //         }
      //       } else {
      //         // 如果不是有效结束，按普通字符处理
      //         buffer += char;
      //       }
      //     }
      //   }
      // }

      // 处理换行符
      if (char === '\n') {
        if (buffer.trim()) {
          segments.push(buffer.trim());
          buffer = '';
        }
        segments.push('\n');
        i++;
        continue;
      }

      // 处理普通字符   
      if (bracketStack.length === 0 && char === ',') {
        if (buffer.trim()) {
          segments.push(buffer.trim());
        }
        buffer = '';
      } else {
        buffer += char;
      }
      i++;
    }

    // 处理剩余的缓冲区内容
    if (buffer.trim()) {
      if (bracketStack.length === 0) {
        segments.push(...buffer.split(',').filter(Boolean).map(s => s.trim()));
      } else {
        segments.push(buffer.trim());
      }
    }

    return segments;
  };

  // 解析文本得到分段
  segments = parseNestedBrackets(text);

  // 处理每个片段
  const existingTokensMap = new Map();
  tokens.value.forEach((token, index) => {
    // 确保每个token都有唯一ID
    if (!token.id) {
      token.id = generateUniqueId();
    }
    existingTokensMap.set(index, token); // 使用索引作为key
  });

  const result = [];

  // 然后处理剩余的segments（新增的token）
  segments.forEach(segment => {
    if (segment === '\n') {
      // 保留换行符作为特殊token
      result.push({
        id: generateUniqueId(),
        text: '\n',
        translate: '',
        isPunctuation: false,
        isEditing: false,
        isHidden: false,
        color: ''
      });
    } else if (segment.trim()) {
      // 处理非空文本
      const trimmedSegment = segment.trim();
      // 检查是否是Lora标签格式 <wlr:LoraName:weight1:weight2>
      const isLoraTag = /^<wlr:[^:]+:\d+(\.\d+)?:\d+(\.\d+)?>$/.test(trimmedSegment);

      // 优先匹配非隐藏的token
      // 编辑中的 token 额外允许 trim 后匹配：内联编辑可能产生首尾空格的中间态文本，
      // 若按原文精确匹配会失配并新建 isEditing:false 的对象顶掉正在编辑的输入框
      let matched = false;
      for (const [index, token] of existingTokensMap) {
        if ((token.text === trimmedSegment || (token.isEditing && token.text.trim() === trimmedSegment)) && !token.isHidden && !result.includes(token)) {
          // 如果是已存在的token，确保更新其Lora标签状态
          if (isLoraTag && !token.isLoraTag) {
            token.isLoraTag = true;
          }
          result.push(token);
          existingTokensMap.delete(index);
          matched = true;
          break;
        }
      }

      // 注意：不要在非隐藏 token 匹配失败后复用隐藏 token——
      // 否则重新输入一个已被隐藏的同名提示词时（如通过补全），隐藏 token 会被挪到
      // 新输入的位置且保持隐藏，表现为"隐藏词跑到补全插入的位置、新词不可见"。
      // 隐藏 token 的原位保留由下方 hiddenTokensWithOriginalIndex 重新插入逻辑独立保证。

      if (!matched) {
        result.push({
          id: generateUniqueId(),
          text: trimmedSegment,
          translate: '',
          isPunctuation: false,
          isEditing: false,
          isHidden: false,
          color: '',
          isLoraTag: isLoraTag // 添加Lora标签标识
        });
      }
    }

  });

  // 使用ID来跟踪已处理的隐藏token
  const processedHiddenTokenIds = new Set();

  //重新插入隐藏token到它们原来的位置
  hiddenTokensWithOriginalIndex.forEach(({ token, originalIndex }) => {
    // 如果这个token已经处理过，跳过
    if (processedHiddenTokenIds.has(token.id)) {
      return;
    }

    // 标记这个token已经处理
    processedHiddenTokenIds.add(token.id);

    // 检查结果中是否已经包含这个隐藏token
    const alreadyExists = result.some(t => t.id === token.id);

    // 如果已经存在，不再添加
    if (alreadyExists) {
      return;
    }

    let insertIndex = originalIndex;

    // 确保插入位置有效
    while (insertIndex > result.length) {
      insertIndex--;
    }

    // 如果所有尝试都失败，插入到最后
    if (insertIndex < 0) {
      result.push(token);
    } else {
      result.splice(insertIndex, 0, token);
    }
  });

  tokens.value = result;

  // 更新输入文本，保持原有格式，但排除隐藏的tokens
  inputText.value = tokens.value.length > 0
    ? tokens.value.reduce((acc, token, index) => {
      // 如果token是隐藏的，不添加到输入文本中
      if (token.isHidden) {
        return acc;
      }

      // 如果是换行符，不加逗号
      if (token.text === '\n') {
        // 查找前一个非隐藏token
        const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
        const prevToken = prevNonHiddenIndex !== -1 ? tokens.value[prevNonHiddenIndex] : null;

        // 直接返回换行符，不添加额外的逗号
        // 因为前一个token在处理时已经根据shouldAddComma添加了逗号
        return acc + token.text;
      }

      // 第一个非隐藏token不加逗号前缀
      if (acc === '') {
        // 查找下一个非隐藏token
        let nextNonHiddenIndex = index + 1;
        while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
          nextNonHiddenIndex++;
        }

        // 判断是否是最后一个非隐藏token或者下一个是换行符
        const isLastToken = nextNonHiddenIndex >= tokens.value.length;
        const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;
        const shouldAddComma = isLastToken || (nextToken && nextToken.text === '\n');

        return token.text + (shouldAddComma ? ',' : '');
      }

      // 查找下一个非隐藏token
      let nextNonHiddenIndex = index + 1;
      while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
        nextNonHiddenIndex++;
      }

      // 判断是否是最后一个非隐藏token
      const isLastToken = nextNonHiddenIndex >= tokens.value.length;
      const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;

      // 如果是换行符前或者最后一个token，则添加逗号
      const shouldAddComma = (nextToken && nextToken.text === '\n') || isLastToken;

      // 前一个token是换行符，不加逗号前缀
      const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
      if (prevNonHiddenIndex !== -1 && tokens.value[prevNonHiddenIndex].text === '\n') {
        return acc + token.text + (shouldAddComma ? ',' : '');
      }

      // 其他情况加逗号和空格前缀
      return acc + ', ' + token.text + (shouldAddComma ? ',' : '');
    }, '') : '';


  // 处理历史记录
  if (proceTimeout.value) {
    clearTimeout(proceTimeout.value);
  }
  proceTimeout.value = setTimeout(() => {
    // console.log('处理历史记录');
    finishPromptPutItHistory();
  }, 1000);
  postMessageToWindowsPrompt();

  // 处理翻译
  const batchSize = 50; // 每批处理的数量
  let currentIndex = 0;

  while (currentIndex < tokens.value.length) {
    const endIndex = Math.min(currentIndex + batchSize, tokens.value.length);
    const promises = [];

    for (let i = currentIndex; i < endIndex; i++) {
      if (tokens.value[i].text.length > 0 && !tokens.value[i].translate) {
        let cleanedTrSegment = tokens.value[i].text;
        const text = extractText(cleanedTrSegment.trim());
        promises.push(
          translatorApi.getTranslateLocal(text).then(res => {
            const translate = res;
            tokens.value[i].translate = translate.translated.translate;
            tokens.value[i].color = translate.translated.color;
          })
        );
      }
    }

    await Promise.all(promises);
    currentIndex = endIndex;
  }

  // 处理翻译
  // for (let i = 0; i < tokens.value.length; i++) {
  //   if (tokens.value[i].text.length > 0 && !tokens.value[i].translate) {
  //     let cleanedTrSegment = tokens.value[i].text;
  //     const text = extractText(cleanedTrSegment.trim());
  //     translatorApi.getTranslateLocal(text).then(res => {
  //       const translate = res;
  //       tokens.value[i].translate = translate.translated.translate;
  //       tokens.value[i].color = translate.translated.color;
  //     });
  //   }
  // }

  // 计算token数量（简单实现，可根据实际分词算法调整）
  tokenCount.value = calculateTokens(inputText.value)
};

const oneClickTranslatePrompt = async () => {

  // if (localStorage.getItem('weilin_prompt_ui_translater_setting') == 'translater') {
  const batchSize = 50; // 每批处理的数量
  let currentIndex = 0;
  let processedCount = 0;
  let totalCount = 0;

  // 计算需要翻译的总数
  for (let i = 0; i < tokens.value.length; i++) {
    const token = tokens.value[i];
    if (token.translate && (token.translate === token.text || /[a-zA-Z]/.test(token.translate)) && !(typeof token.text === 'string' && token.text.startsWith('<wlr'))) {
      totalCount++;
    }
  }


  while (currentIndex < tokens.value.length) {
    const endIndex = Math.min(currentIndex + batchSize, tokens.value.length);
    const batchData = [];
    const tokenIndices = [];

    // 收集本批次需要翻译的token
    for (let i = currentIndex; i < endIndex; i++) {
      const token = tokens.value[i];
      // 检查translate是否包含英文字符 /[a-zA-Z]/.test(token.translate)
      if (token.translate && (token.translate === token.text || /[a-zA-Z]/.test(token.translate)) && !(typeof token.text === 'string' && token.text.startsWith('<wlr'))) {
        batchData.push(token.text);
        tokenIndices.push(i);
      }
    }

    if (batchData.length > 0) {

      // 批量翻译：将多个文本用换行符连接
      const combinedText = batchData.join('\n');
      try {
        // 设置超时处理
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('翻译请求超时')), 30000)
        );

        const res = await Promise.race([
          translatorApi.translaterText('', combinedText),
          timeoutPromise
        ]);

        if (res.data && res.data.length > 0) {
          // 拆分翻译结果
          const translatedResults = res.data.split('\n');

          // 验证结果数量匹配
          if (translatedResults.length === batchData.length) {
            // 将翻译结果回填到对应的token
            for (let j = 0; j < tokenIndices.length; j++) {
              const tokenIndex = tokenIndices[j];
              if (j < translatedResults.length && translatedResults[j].trim()) {
                tokens.value[tokenIndex].translate = translatedResults[j].trim();
                processedCount++;
              }
            }
          } else {
            throw new Error(`翻译结果数量不匹配: 期望${batchData.length}个，实际${translatedResults.length}个`);
          }
        } else {
          throw new Error('翻译返回结果为空');
        }
      } catch (e) {
        console.error(`第 ${Math.floor(currentIndex / batchSize) + 1} 批批量翻译失败:`, e);

        // 回退到逐个翻译
        let fallbackCount = 0;
        for (let j = 0; j < tokenIndices.length; j++) {
          const tokenIndex = tokenIndices[j];
          const textToTranslate = batchData[j];

          try {
            const res = await translatorApi.translaterText('', textToTranslate);
            if (res.data && res.data.length > 0) {
              tokens.value[tokenIndex].translate = res.data;
              processedCount++;
              fallbackCount++;
            }
          } catch (fallbackError) {
            console.error(`单个翻译失败 (${textToTranslate}):`, fallbackError);
          }
        }
      }
    }

    currentIndex = endIndex;
  }

  // }

  // else {

  //   const batchSize = 2; // 每批最多2个
  //   let currentIndex = 0;
  //   const MAX_TOKEN_LENGTH = 20; // 超过20单独翻译

  //   while (currentIndex < tokens.value.length) {
  //     let batchTranslateData = [];
  //     let batchTokenIds = [];
  //     let batchTokenLength = 0;
  //     let batchCount = 0;

  //     // 收集本批次
  //     for (let i = currentIndex; i < tokens.value.length; i++) {
  //       const token = tokens.value[i];
  //       if (
  //         token.translate &&
  //         /[a-zA-Z]/.test(token.translate) &&
  //         !(typeof token.text === 'string' && token.text.startsWith('<wlr'))
  //       ) {
  //         const textToTranslate = token.text;
  //         const textLen = textToTranslate.length;

  //         if (textLen > MAX_TOKEN_LENGTH) {
  //           // 单独翻译
  //           const jsonString = JSON.stringify([{ index: token.id, text: textToTranslate, translate: '' }]);
  //           await tryTranslate(jsonString, [token.id]);
  //           currentIndex = i + 1;
  //           break;
  //         } else {
  //           batchTranslateData.push({ index: token.id, text: textToTranslate, translate: '' });
  //           batchTokenIds.push(token.id);
  //           batchTokenLength += textLen;
  //           batchCount++;
  //         }
  //       }

  //       // 满2个就发起翻译
  //       if (batchCount === batchSize) {
  //         break;
  //       }
  //     }

  //     if (batchTranslateData.length > 0) {
  //       const jsonString = JSON.stringify(batchTranslateData);
  //       await tryTranslate(jsonString, batchTokenIds);
  //     }

  //     // 跳过已处理的token
  //     currentIndex += batchCount > 0 ? batchCount : 1;
  //   }

  // }

};

const tryTranslate = async (jsonString, tokenIds) => {
  let retry = 0;
  while (retry < 2) {
    try {
      const res = await translatorApi.translaterText(jsonString, "");
      if (res && res.data) {
        const jsonData = JSON.parse(res.data);
        for (let j = 0; j < jsonData.length; j++) {
          const item = jsonData[j];
          const tokenIndex = tokens.value.findIndex(t => t.id === item.index);
          if (tokenIndex !== -1) {
            tokens.value[tokenIndex].translate = item.translate;
          }
        }
        return true; // 成功
      }
      return false;
    } catch (e) {
      retry++;
      if (retry >= 2) {
        // 最多重试一次，失败则跳过
        return false;
      }
    }
  }
  return false;
};

const tempInputText = ref('')

const finishPromptPutItHistory = () => {
  // 74.97：历史入史统一移到提交队列时（js_node 的 app.queuePrompt 钩子按节点 widget
  // 内容各自入史），编辑动作不再实时写历史，这里只负责把当前内容同步回节点 widget。
  // （函数名沿用旧称，12 处调用点语义不变）
  postMessageToWindowsPrompt()
}

const postMessageToWindowsPrompt = () => {
  if (selectedLoras.value.length > 0) {
    tempInputText.value = inputText.value
    const tempLora = selectedLoras.value.filter(lora => !lora.hidden);
    let putJson = {
      prompt: inputText.value,
      lora: "",
      temp_prompt: tokens.value,
      temp_lora: selectedLoras.value
    }
    if (tempLora.length > 0) {
      putJson.lora = tempLora
    }
    const jsonStr = JSON.stringify(putJson)
    window.postMessage({
      type: 'weilin_prompt_ui_prompt_finish_prompt',
      data: jsonStr
    }, '*')
    // console.log('postMessageToWindowsPrompt sent with lora:', jsonStr);
  } else {
    tempInputText.value = inputText.value
    const putJson = {
      prompt: inputText.value,
      lora: "",
      temp_prompt: tokens.value,
      temp_lora: ""
    }
    const jsonStr = JSON.stringify(putJson)
    window.postMessage({
      type: 'weilin_prompt_ui_prompt_finish_prompt',
      data: jsonStr
    }, '*')
    // console.log('postMessageToWindowsPrompt sent with lora:', jsonStr);
  }
}


// 显示控制栏
// 修正悬浮控制栏的弹出位置：水平方向夹在"所在窗口 ∩ 视口"的边界内，
// 避免最外侧标签的悬浮栏被 ComfyUI 侧边栏遮挡；窗口顶部放不下时翻转到标签下方
const controlsBarRef = ref(null)
// 悬浮栏是否已修正好位置（先隐藏测量、修正边界后才显示，避免弹出位置跳动）
const controlsVisible = ref(false)

// 若焦点在悬浮栏内部（如权重输入框），取消焦点
// ——否则切换到其他标签的悬浮栏时，旧输入框仍持有焦点，滚轮/键盘会错误地作用到新标签
const blurControlsFocus = () => {
  const bar = controlsBarRef.value
  const el = document.activeElement
  if (bar && el && el !== document.body && bar.contains(el)) {
    el.blur()
  }
}

const clampControlsPosition = (winEl, tagRect) => {
  const bar = controlsBarRef.value
  if (!bar || !tagRect) return
  const r = bar.getBoundingClientRect()
  if (!r.width) return

  const margin = 4
  const winR = winEl ? winEl.getBoundingClientRect() : null
  const minX = Math.max(margin, winR ? winR.left : margin)
  const maxX = Math.min(window.innerWidth - margin, winR ? winR.right : window.innerWidth - margin)
  const minY = Math.max(margin, winR ? winR.top : margin)

  // 垂直：按浮窗实测高度重算——默认贴在标签上方（留 6px 间隙），上方放不下翻转到标签下方。
  // 不能写死偏移：封面缩略图(96px)会把浮窗撑高，固定 -50px 会让浮窗底缘压住标签
  let top = controlsPosition.value.top
  const aboveTop = tagRect.top - r.height - 6
  if (aboveTop >= minY) {
    top = `${aboveTop}px`
  } else {
    top = `${tagRect.bottom + 6}px`
  }

  // 水平：超出边界则平移拉回（bar 是 translateX(-50%) 居中定位，调整 left 即 1:1 平移）
  let dx = 0
  if (r.left < minX) {
    dx = minX - r.left
  } else if (r.right > maxX) {
    dx = maxX - r.right
  }

  if (dx || top !== controlsPosition.value.top) {
    const curLeft = parseFloat(controlsPosition.value.left)
    controlsPosition.value = {
      top,
      left: `${curLeft + dx}px`
    }
  }
}

const showControls = (index, event) => {
  // 鼠标进入标签：标记悬停态（隐藏判定用）。
  // 钉住只保护"当初钉住的那个标签"：悬停其他标签才解除；
  // 重新悬停同一标签（详情窗还开着）必须保留钉住，否则移开指针悬浮栏会消失
  isOverTag.value = true
  if (controlsPinned.value && index !== pinnedTagIndex) {
    controlsPinned.value = false
    loraDetailOpenedForCover = false
    pinnedTagIndex = null
  }
  // 框选模式下不显示控制菜单
  if (isBoxSelectMode.value) {
    return;
  }

  // 标签拖拽或编辑期间不显示控制栏（拖动/编辑输入时会扫过其他标签，避免悬浮栏闪烁弹出）
  if (isDragging.value || mouseDragState.active || mouseDragState.pending) {
    return;
  }
  if (tokens.value.some(t => t.isEditing)) {
    return;
  }

  // 清除任何现有的定时器
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
    hideTimeout.value = null
  }

  const rect = event.target.getBoundingClientRect()
  // 切换到其他标签的悬浮栏时，取消旧权重输入框的焦点
  if (index !== activeControls.value) {
    blurControlsFocus()
  }
  // 先隐藏（opacity+pointer-events 方式，元素仍渲染可测量），等边界修正完成后再显示
  controlsVisible.value = false
  controlsPosition.value = {
    top: `${rect.top - 50}px`,
    left: `${rect.left + rect.width / 2}px`
  }
  activeControls.value = index

  // 边界修正：最外侧标签的悬浮栏可能超出窗口/视口被 ComfyUI 侧边栏遮挡
  const winEl = event.target.closest('.weilin_prompt_ui_draggable-window')
  nextTick(() => {
    clampControlsPosition(winEl, rect)
    // 修正完成，直接出现在正确位置（无移动动画）
    controlsVisible.value = true
  })

  // 检测并设置权重值
  const text = tokens.value[index].text;
  weightValue.value = findInnerWeight(text);

  tagTipsPosition.value = {
    top: `${rect.bottom + window.scrollY + rect.height + 10}px`,
    left: `${rect.left + rect.width / 2}px`
  };
  if (!tokens.value[index].isLoraTag && localStorage.getItem('weilin_prompt_ui_tag_tips') !== 'false') {
    showTagTipsBox.value = true;
  }
}


// 定义递归函数来查找最内层的权重
const findInnerWeight = (content) => {
  // 定义括号匹配正则表达式
  const bracketPairs = [
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '<', close: '>' }
  ];

  // 查找最内层内容
  for (const pair of bracketPairs) {
    if (content.startsWith(pair.open) && content.endsWith(pair.close)) {
      // 递归查找内层内容
      return findInnerWeight(content.slice(1, -1));
    }
  }

  // 如果没有括号，直接匹配权重
  const weightMatch = content.match(/:(\d+(\.\d+)?)$/);
  return weightMatch ? parseFloat(weightMatch[1]) : 1;
};

const hideTimeout = ref(null)
// 鼠标是否悬停在触发悬浮栏的标签上（与 isOverControls——悬停在悬浮栏上——互补）。
// 钉住解除后的"重新隐藏判定"必须同时排除这两处：鼠标可能仍在标签或悬浮栏上，
// 此时不能隐藏（否则正被悬停的标签的悬浮栏会被误藏）
const isOverTag = ref(false)

// 统一的延迟隐藏判定：钉住解除（浮窗/详情窗关闭）或鼠标离开标签后调用。
// 100ms 内若鼠标进入标签/悬浮栏，或钉住重新置位，则不隐藏
const scheduleHideCheck = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value)
  }
  hideTimeout.value = setTimeout(() => {
    if (!isOverControls.value && !controlsPinned.value && !isOverTag.value) {
      hideControls()
    }
    hideTimeout.value = null
  }, 100)
}

// 处理鼠标离开词组
const handleMouseLeave = (index) => {
  isOverTag.value = false
  scheduleHideCheck()
  showTagTipsBox.value = false;
}

// 处理鼠标离开控制栏
const handleControlsLeave = () => {
  isOverControls.value = false
  handleMouseLeave(activeControls.value)
  // 确保框选模式在离开控制栏后重置
  setTimeout(() => {
    if (!isOverControls.value) {
      isBoxSelectMode.value = false
    }
  }, 100)
}

// 隐藏控制栏
const hideControls = () => {
  // 隐藏时取消悬浮栏内部（权重输入框）的焦点，避免焦点残留在不可见元素上
  blurControlsFocus()
  // controlsPinned：信息浮窗或 lora 详情窗存在时钉住悬浮栏（需求：此时悬浮栏不自动消失）
  if (!isOverControls.value && !controlsPinned.value) {
    activeControls.value = null
  }
}

// 处理删除按钮点击
const handleDelete = () => {
  if (activeControls.value !== null) {
    const index = activeControls.value
    deleteToken(index)
    // 删除后立即隐藏控制栏
    activeControls.value = null
    isOverControls.value = false
  }
}


// 处理添加换行符
const handelLineToken = () => {
  if (activeControls.value !== null) {
    const index = activeControls.value;
    // 在当前 token 后插入一个换行符 token
    tokens.value.splice(index + 1, 0, {
      id: generateUniqueId(),
      text: '\n',
      translate: '',
      isPunctuation: false,
      isEditing: false,
      isHidden: false,
      color: ''
    });
    updateInputText();
  }
}
// 删除词组
const deleteToken = (index) => {
  const text = inputText.value
  let targetToken = tokens.value[index]
  let lastIndex = 0
  let tokenPos = -1

  // 查找要删除的词组位置
  for (let i = 0; i < index; i++) {
    let pos = text.indexOf(tokens.value[i].text, lastIndex)
    if (pos !== -1) {
      lastIndex = pos + tokens.value[i].text.length
    }
  }

  // 找到目标词组的位置
  if (targetToken.text === '\n' || targetToken.text === '\t') {
    for (let i = lastIndex; i < text.length; i++) {
      if (text[i] === targetToken.text) {
        tokenPos = i
        break
      }
    }
  } else {
    tokenPos = text.indexOf(targetToken.text, lastIndex)
  }

  if (tokenPos !== -1) {
    // 如果删除的是换行符，则替换为空格
    const replacement = targetToken.text === '\n' ? ' ' : ''
    const newText = text.substring(0, tokenPos) + replacement + text.substring(tokenPos + targetToken.text.length)
    inputText.value = newText
  }

  tokens.value.splice(index, 1)
  // 更新输入文本，保持原有格式，但排除隐藏的tokens
  inputText.value = tokens.value.length > 0
    ? tokens.value.reduce((acc, token, index) => {
      // 如果token是隐藏的，不添加到输入文本中
      if (token.isHidden) {
        return acc;
      }

      // 如果是换行符，不加逗号
      if (token.text === '\n') {
        // 查找前一个非隐藏token
        const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
        const prevToken = prevNonHiddenIndex !== -1 ? tokens.value[prevNonHiddenIndex] : null;

        // 直接返回换行符，不添加额外的逗号
        // 因为前一个token在处理时已经根据shouldAddComma添加了逗号
        return acc + token.text;
      }

      // 第一个非隐藏token不加逗号前缀
      if (acc === '') {
        // 查找下一个非隐藏token
        let nextNonHiddenIndex = index + 1;
        while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
          nextNonHiddenIndex++;
        }

        // 判断是否是最后一个非隐藏token或者下一个是换行符
        const isLastToken = nextNonHiddenIndex >= tokens.value.length;
        const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;
        const shouldAddComma = isLastToken || (nextToken && nextToken.text === '\n');

        return token.text + (shouldAddComma ? ',' : '');
      }

      // 查找下一个非隐藏token
      let nextNonHiddenIndex = index + 1;
      while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
        nextNonHiddenIndex++;
      }

      // 判断是否是最后一个非隐藏token
      const isLastToken = nextNonHiddenIndex >= tokens.value.length;
      const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;

      // 如果是换行符前或者最后一个token，则添加逗号
      const shouldAddComma = (nextToken && nextToken.text === '\n') || isLastToken;

      // 前一个token是换行符，不加逗号前缀
      const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
      if (prevNonHiddenIndex !== -1 && tokens.value[prevNonHiddenIndex].text === '\n') {
        return acc + token.text + (shouldAddComma ? ',' : '');
      }

      // 其他情况加逗号和空格前缀
      return acc + ', ' + token.text + (shouldAddComma ? ',' : '');
    }, '') : '';

  finishPromptPutItHistory()
}

// 处理词组编辑
const handleTokenEdit = (index, event) => {
  const token = tokens.value[index]
  if (!token) return

  // 直接更新词组文本，再从 tokens 重建 inputText
  // 旧实现用 indexOf 链在 inputText 中反查目标位置后手工拼接：
  // 前方存在隐藏 token（其文本不在 inputText 中，却可能误命中别处）、重复文本、
  // 首尾空格差异等场景都会定位失败（tokenPos === -1），编辑被静默丢弃，
  // 表现为"左键编辑的内容无法保留"。现改为 tokens 为唯一权威、单向派生 inputText。
  token.text = event.target.value
  updateInputText()
  finishPromptPutItHistory()
}

// 修改 startEditing 函数，添加对标点符号的处理
const startEditing = (index) => {
  // 如果是标点符号，不允许编辑
  if (tokens.value[index].isPunctuation) {
    return;
  }

  tokens.value[index].isEditing = true;
  // 进入编辑时收起悬浮控制栏与提示框，编辑期间不再弹出
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
  isOverControls.value = false;
  activeControls.value = null;
  controlsVisible.value = false;
  showTagTipsBox.value = false;
  setTimeout(() => {
    const input = tokenInputRefs[index];
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
      adjustInputWidth(input);
      input.addEventListener('input', () => adjustInputWidth(input));
      finishPromptPutItHistory()
    }
  });
}

// 调整输入框宽度
const adjustInputWidth = (input) => {
  // 创建一个临时的 span 元素来计算文本宽度
  const span = document.createElement('span')
  span.style.visibility = 'hidden'
  span.style.position = 'absolute'
  span.style.whiteSpace = 'pre'
  // 复制输入框的样式
  const computedStyle = window.getComputedStyle(input)
  span.style.font = computedStyle.font
  span.style.fontSize = computedStyle.fontSize
  span.style.fontFamily = computedStyle.fontFamily
  span.style.padding = computedStyle.padding
  span.style.border = computedStyle.border
  span.textContent = input.value || input.placeholder || ''

  document.body.appendChild(span)
  // 设置输入框宽度：文本宽度 + 充足余量，最窄 90px 保证输入舒适，最宽 360px 防止撑爆布局
  const width = span.offsetWidth
  input.style.width = `${Math.min(Math.max(width + 20, 90), 360)}px`
  document.body.removeChild(span)
}

// 完成编辑
const finishEditing = (index) => {
  tokens.value[index].isEditing = false
}

// 删除 watch 监听器，因为我们现在使用直接的输入事件处理

// 监听词组的变化
// deep watch 每次变更都遍历全部 token（O(n)），而 token 内联编辑的每个按键都会触发；
// 加 200ms 尾随防抖：行为不变（停止变更后同步一次 inputText），高频输入时开销从每键一次降到每停顿一次
let updateInputTextTimer = null
watch(tokens, () => {
  if (updateInputTextTimer) clearTimeout(updateInputTextTimer)
  updateInputTextTimer = setTimeout(() => {
    updateInputTextTimer = null
    updateInputText()
    syncWlrTagsWithStack()
  }, 200)
}, { deep: true })

watch(selectedLoras, () => {
  // 快照比较防循环：文本→堆同步引起的变化不再回写文本；堆 UI 的改动则反写文本
  const snap = stackSnapshot()
  if (!syncingFromText && snap !== lastStackSnapshot) {
    lastStackSnapshot = snap
    scheduleStackToText()
  }
  finishPromptPutItHistory()
}, { deep: true })

// 切换语言选择器
const toggleLanguageSelector = () => {
  showLanguageSelector.value = !showLanguageSelector.value
  if (showLanguageSelector.value) {
    nextTick(() => {
      const btnRect = langBtnRef.value.getBoundingClientRect()
      languageSwitcherRef.value?.setPosition(btnRect)
    })
  }
}

// 关闭语言选择器
const closeLanguageSelector = () => {
  showLanguageSelector.value = false
}

// 处理点击外部
const handleClickOutside = (event) => {
  if (langBtnRef.value && !langBtnRef.value.contains(event.target) &&
    languageSwitcherRef.value && !languageSwitcherRef.value.$el.contains(event.target)) {
    closeLanguageSelector()
  }
  // 如果点击的不是补全窗口或输入框
  if (
    autocompleteContainerRef.value?.contains &&
    inputAreaRef.value?.contains &&
    !autocompleteContainerRef.value.contains(event.target) &&
    !inputAreaRef.value.contains(event.target)
  ) {
    showAutocomplete.value = false;
  }

}


// 打开标签管理器（再次点击关闭）
const openTagManager = () => {
  // 发送消息给父窗口
  window.parent.postMessage({ type: 'weilin_prompt_ui_openTagManager_prompt', data: { toggle: true } }, '*')
}

const openLoraManager = () => {
  // 发送消息给父窗口
  window.parent.postMessage({ type: 'weilin_prompt_ui_openLoraManager', data: { toggle: true } }, '*')
}

const openHistoryBox = () => {
  // 发送消息给父窗口
  window.parent.postMessage({ type: 'weilin_prompt_ui_openHistoryManager', data: { toggle: true } }, '*')
}

const openFavoritesBox = () => {
  // 发送消息给父窗口（收藏夹独立窗口）
  window.parent.postMessage({ type: 'weilin_prompt_ui_openFavoritesManager', data: { toggle: true } }, '*')
}

// 快速收藏：弹出名称输入窗（名称由用户决定，预填提示词前 20 字可改），确认后把当前提示词与
// 已加载的 Lora 存入收藏夹（方案 A {prompt, lora} 格式）；成功后广播刷新消息，收藏夹窗口若开着会自动刷新
const showQuickFavDialog = ref(false)
const quickFavName = ref('')
const quickFavorite = () => {
  const text = (inputText.value || '').trim()
  if (!text) {
    message({ type: 'warn', str: 'message.quickFavoriteEmpty' })
    return
  }
  quickFavName.value = text.length > 20 ? text.slice(0, 20) + '…' : text
  showQuickFavDialog.value = true
}
const confirmQuickFavorite = () => {
  const name = (quickFavName.value || '').trim()
  if (!name) {
    message({ type: 'warn', str: 'message.quickFavoriteNameRequired' })
    return
  }
  const text = (inputText.value || '').trim()
  const tagJson = JSON.stringify({
    prompt: text,
    lora: selectedLoras.value.length > 0 ? selectedLoras.value : ''
  })
  historyApi
    .addFavorite({ name: name, tag: tagJson, color: '' })
    .then((res) => {
      // 后端去重：tag 完全一致的收藏已存在时不重复插入，返回 existed 标记
      if (res && res.data && res.data.existed) {
        message({ type: 'warn', str: 'message.addFavoriteIsExist' })
      } else {
        message({ type: 'success', str: 'message.addFavoriteSuccess' })
      }
      window.postMessage({ type: 'weilin_prompt_ui_refresh_all_data' }, '*')
      showQuickFavDialog.value = false
    })
    .catch(() => {
      message({ type: 'warn', str: 'message.networkError' })
    })
}

// 添加折叠状态控制
const showTagManager = ref(true)

// 切换标签管理器显示状态
const toggleTagManager = () => {
  showTagManager.value = !showTagManager.value
}

// 添加折叠状态控制
const showLoraManager = ref(false)

// 切换Lora管理器显示状态
const toggleLoraManager = () => {
  showLoraManager.value = !showLoraManager.value
}

// ===== 74.88 收起空白：Lora 收起后窗口高度仍停留在展开时的大小，底部留一大块空白 =====
// 收起时把窗口高度收缩到内容自然高度（经 App 更新 windows.prompt.size，走正常 props 链，
// 与拖拽 resize 同源、会被持久化）；重新展开时恢复收起前的高度。
const promptBoxEl = ref(null)
const emit = defineEmits(['request-window-size'])
const previousWindowHeight = ref(null)
// 74.91：窗口自动缩放（收起 Lora 时收缩到内容高度）只在“带 Lora 堆”的提示词窗口生效；
// 无 Lora 堆的提示词窗口（无论主/编辑器，hasPromptLoraStack 为 false）保留用户手动尺寸，
// 收起/展开 Lora 模块都不改变窗口大小。判定维度必须用 hasPromptLoraStack 而非 promptManager——
// 因为 openPromptBox 在非 WeiLinPromptUI 节点上也是 promptManager==='prompt' 但无 Lora 堆，
// 用 promptManager 会把这类窗口误判成“应收缩”，导致收起时窗口变小。
const canAutoFitWindow = computed(() => props.hasPromptLoraStack)
const emitWindowSize = (height) => {
  const boxEl = promptBoxEl.value
  const winEl = boxEl && boxEl.closest('.weilin_prompt_ui_draggable-window')
  if (!boxEl || !winEl) return
  emit('request-window-size', { width: winEl.offsetWidth, height })
}
// 收起态下把窗口收缩到内容自然高度。
// 74.88c 关键修正：不能用 window-content.scrollHeight——它被钳制为 ≥ clientHeight，
// 内容比窗口矮时读到的就是当前窗口高（收缩永远空操作、空白原样保留），
// 内容比窗口高时又会把窗口撑到全部内容高（窗口反而变大）。
// 改为直接量内容根元素（prompt-box）的自然高度；且收起只缩不涨（Math.min）。
const fitWindowToCollapsedContent = async () => {
  await nextTick()
  const boxEl = promptBoxEl.value
  const winEl = boxEl && boxEl.closest('.weilin_prompt_ui_draggable-window')
  if (!boxEl || !winEl) return
  const contentEl = winEl.querySelector('.weilin_prompt_ui_window-content')
  if (!contentEl) return
  const contentPadding = contentEl.offsetHeight - contentEl.clientHeight // window-content 上下 padding
  const chrome = winEl.offsetHeight - contentEl.clientHeight // 标题栏 + 窗口边框
  const natural = boxEl.offsetHeight + contentPadding + chrome
  emitWindowSize(Math.min(winEl.offsetHeight, Math.max(200, natural)))
}
watch(showLoraManager, async (visible) => {
  const boxEl = promptBoxEl.value
  const winEl = boxEl && boxEl.closest('.weilin_prompt_ui_draggable-window')
  if (!boxEl || !winEl) return
  // 74.95b/74.96：展开/收起 Lora 模块会切换窗口内滚动容器
  //（收起态由 window-content 滚、展开态由 .main-content 滚）并改 flex 链，
  // 浏览器把这个切换当成"容器换了"把 scrollTop 重置为 0 → 视野瞬间回顶。
  // 变化前（watch 默认 pre-flush，DOM 尚未重排）保存两个容器的 scrollTop，
  // 变化后把"之前活跃容器"的偏移还给"现在活跃容器"。
  const contentEl = winEl.querySelector('.weilin_prompt_ui_window-content')
  const mainEl = boxEl.querySelector('.weilin_prompt_ui_main-content')
  const savedContent = contentEl ? contentEl.scrollTop : 0
  const savedMain = mainEl ? mainEl.scrollTop : 0

  // 窗口高度自适应（仅 lora 堆窗口）：展开恢复保存高度，收起缩到内容自然高。
  // 注意：滚动位置保护要两种窗口都做，不能因为无 lora 堆就跳过（否则收起会回顶）。
  if (canAutoFitWindow.value) {
    if (!visible) {
      previousWindowHeight.value = winEl.offsetHeight
      await fitWindowToCollapsedContent()
    } else if (previousWindowHeight.value) {
      emitWindowSize(previousWindowHeight.value)
      previousWindowHeight.value = null
    }
  }

  // 74.96b：恢复滚动位置必须赶在浏览器"绘制"之前，否则会先画出错误的一帧再跳 → 肉眼闪烁。
  // 塌陷/展开的 DOM 与窗口高度自适应是两次独立的响应式更新，需要两次 nextTick 才都 flush；
  // 微任务早于下一帧绘制，此时写入 scrollTop，浏览器不会画出中间态。
  // 闪烁主因：收起瞬间 main-content 失去 overflow-y:auto，原本被裁掉的提示词内容会一次性
  // 全部展开；若等 rAF 之后再补写 scrollTop，那帧"多出来的内容"已经被画出来了。
  const applyScroll = () => {
    if (visible) {
      // 收起→展开：之前滚动容器是 window-content，把它的偏移还给 main-content
      if (mainEl) mainEl.scrollTop = savedContent
    } else {
      // 展开→收起：之前滚动容器是 main-content，把它的偏移还给 window-content
      if (contentEl) contentEl.scrollTop = savedMain
    }
  }
  await nextTick()
  await nextTick()
  applyScroll()
  // 兜底：若异步内容/窗口高度晚一步稳定（上面的写入被钳制），再校正一次；
  // 值没变就不重复写，避免制造二次闪烁。
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const settledEl = visible ? mainEl : contentEl
  const settledVal = visible ? savedContent : savedMain
  if (settledEl && Math.abs(settledEl.scrollTop - settledVal) > 2) applyScroll()
})
// 74.88 补：窗口打开时 Lora 固定是收起态（showLoraManager 不持久化，默认 false），
// 而保存的窗口尺寸可能是上次展开时的大尺寸 → 打开后内容不满、底部空白。
// 等首帧渲染稳定后自适应一次；分类/chips 是异步渲染，延迟再做一次兜底。
onMounted(() => {
  if (showLoraManager.value || !canAutoFitWindow.value) return
  const run = () => {
    if (!showLoraManager.value) fitWindowToCollapsedContent()
  }
  requestAnimationFrame(() => requestAnimationFrame(run))
  setTimeout(run, 600)
})

// 内嵌 Lora 管理器的高度自适应由 lora_index.vue 自己管理（is-embedded 模式：
// 还有数据未加载时撑满窗口内容区剩余空间，全部加载完后收缩到内容实际高度），
// 这里不再写死/计算容器高度——此前在这里算固定高度，分类条目少时底部会留一大块空白。

const resizeObserver = ref(null)

const handleTextareaResize = () => {
  if (inputAreaRef.value) {
    const height = inputAreaRef.value.clientHeight
    localStorage.setItem('weilinPromptTextAreaHeight', height)
  }
}

// 在输入框内点击切换输入位置（光标换位）时关闭补全弹窗：
// 补全内容针对原输入位置，光标移走后不应继续停留
const closeAutocompleteOnCaretMove = () => {
  if (showAutocomplete.value) closeAutocomplete();
};

const setupCursorTracking = () => {
  const textarea = inputAreaRef.value;
  if (!textarea) return;

  // 添加光标位置变化监听
  textarea.addEventListener('keyup', updateAutocompletePosition);
  textarea.addEventListener('click', updateAutocompletePosition);
  textarea.addEventListener('input', updateAutocompletePosition);
  // 输入框内点击（切换输入位置）时关闭补全弹窗
  textarea.addEventListener('click', closeAutocompleteOnCaretMove);
};

const updateAutocompletePosition = () => {
  if (showAutocomplete.value) {
    calculateAutocompletePosition();
  }
};

// 保存文本区域高度到localStorage
const saveTextareaHeight = () => {
  if (inputAreaRef.value) {
    const height = inputAreaRef.value.style.height || `${inputAreaRef.value.offsetHeight}px`;
    localStorage.setItem('weilinPromptTextAreaHeight', height);
  }
};

// 从localStorage恢复文本区域高度
const restoreTextareaHeight = () => {
  const savedHeight = localStorage.getItem('weilinPromptTextAreaHeight');
  if (savedHeight && inputAreaRef.value) {
    inputAreaRef.value.style.height = savedHeight;
  }
};

// 添加消息监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // ESC 逐层关闭浮层（capture 阶段优先拦截，保证先关弹窗/下拉再谈其他行为）
  document.addEventListener('keydown', handleGlobalEscape, true);
  window.addEventListener('message', handleMessage)
  initTranslate()
  setupCursorTracking()

  nextTick(() => {
    restoreTextareaHeight();
  });

  // 添加框选功能的事件监听 - 修复嵌套nextTick问题
  // 直接在主nextTick后绑定事件，不再使用嵌套的nextTick
  setTimeout(() => {
    // 优先通过ref获取元素
    if (!tokensContainerRef.value) {
      tokensContainerRef.value = document.querySelector('.tokens-container')
    }

    if (tokensContainerRef.value) {
      // 移除可能存在的旧监听器，避免重复绑定
      tokensContainerRef.value.removeEventListener('mousedown', handleMouseDown)
      tokensContainerRef.value.removeEventListener('mousemove', handleMouseMove)
      tokensContainerRef.value.removeEventListener('mouseup', handleMouseUp)
      tokensContainerRef.value.removeEventListener('mouseleave', handleMouseUp)

      // 重新绑定监听器
      tokensContainerRef.value.addEventListener('mousedown', handleMouseDown)
      tokensContainerRef.value.addEventListener('mousemove', handleMouseMove)
      tokensContainerRef.value.addEventListener('mouseup', handleMouseUp)
      tokensContainerRef.value.addEventListener('mouseleave', handleMouseUp)

      // 确保容器有合适的样式允许框选
      tokensContainerRef.value.style.userSelect = 'none';
      tokensContainerRef.value.style.cursor = 'default';

    } else {
      console.warn('未能找到tokens-container元素，框选功能可能无法正常工作')
    }
  }, 100); // 短暂延迟确保DOM完全渲染
})

onBeforeUnmount(() => {
  // 清理框选功能的事件监听器
  if (tokensContainerRef.value) {
    tokensContainerRef.value.removeEventListener('mousedown', handleMouseDown)
    tokensContainerRef.value.removeEventListener('mousemove', handleMouseMove)
    tokensContainerRef.value.removeEventListener('mouseup', handleMouseUp)
    tokensContainerRef.value.removeEventListener('mouseleave', handleMouseUp)
  }
  // 清理自定义拖拽的文档级监听器
  document.removeEventListener('mousemove', handleDocumentMouseMove)
  document.removeEventListener('mouseup', handleDocumentMouseUp)
  // 移除选择框
  removeSelectionBox()
})


// 处理鼠标按下事件，开始框选 - 增强稳定版
const handleMouseDown = (event) => {
  // 只有在按下左键且没有Ctrl/Cmd键时才开始框选
  if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
    // 检查点击目标是否在标签容器内且不是标签本身或控制元素
    const tokenItem = event.target.closest('.token-item-box, .token-item, .lora-tag-icon, .newline-token, .tab-token, .delete-btn, .weight-control, .bracket-btn, .translate-button, .tag-tips-box, .token-controls')
    const tokensContainer = tokensContainerRef.value

    // 如果点击的是空白区域，记录起始位置但不立即创建选择框
    if (tokensContainer && !tokenItem) {
      // 重置所有相关状态变量，确保开始新的框选操作前状态是干净的
      isPotentialBoxSelection.value = false
      isSelecting.value = false
      isUpdatingSelectionBox.value = false
      isUpdatingSelectedTokens.value = false

      // 在开始新的框选前，先关闭任何已存在的操作菜单
      closeSelectionActions()

      // 移除任何可能残留的选择框
      removeSelectionBox()

      // 获取容器的位置，将选择框限制在容器内
      const containerRect = tokensContainer.getBoundingClientRect()
      selectionStart.value = {
        x: Math.max(event.clientX, containerRect.left),
        y: Math.max(event.clientY, containerRect.top)
      }
      selectionEnd.value = {
        x: Math.max(event.clientX, containerRect.left),
        y: Math.max(event.clientY, containerRect.top)
      }

      // 标记为潜在的框选操作，但不立即开始框选
      isPotentialBoxSelection.value = true

      // 记录日志以便调试

      // 正常的左键点击应该允许默认行为，比如让文本框失焦
      // 不再阻止默认行为和冒泡，以保留正常的左键功能
    }
  }
}

// 处理鼠标移动事件，更新框选区域 - 流畅版
const handleMouseMove = (event) => {
  // 如果是潜在的框选操作（已按下鼠标但尚未开始框选）
  if (isPotentialBoxSelection.value && tokensContainerRef.value && !isSelecting.value) {
    // 计算鼠标移动的距离
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - selectionStart.value.x, 2) +
      Math.pow(event.clientY - selectionStart.value.y, 2)
    )

    // 如果移动距离超过阈值（例如3像素），才真正开始框选
    if (moveDistance > 3) {
      // 强制阻止默认行为和冒泡，防止浏览器默认的文本选择
      event.preventDefault()
      event.stopPropagation()

      // 进入框选模式
      isSelecting.value = true
      isBoxSelectMode.value = true

      // 清空选中的标签
      selectedTokens.value = []

      // 创建选择框元素
      createSelectionBox()

    }
  }

  // 已经处于框选模式，更新选择框
  if (isSelecting.value && tokensContainerRef.value) {
    // 强制阻止默认行为和冒泡，防止浏览器默认的文本选择
    event.preventDefault()
    event.stopPropagation()

    // 获取容器的位置，将选择框限制在容器内
    const containerRect = tokensContainerRef.value.getBoundingClientRect()
    selectionEnd.value = {
      x: Math.min(Math.max(event.clientX, containerRect.left), containerRect.right),
      y: Math.min(Math.max(event.clientY, containerRect.top), containerRect.bottom)
    }

    // 确保选择框至少有最小尺寸可见
    const minSize = 5
    if (Math.abs(selectionEnd.value.x - selectionStart.value.x) < minSize) {
      selectionEnd.value.x = selectionStart.value.x + minSize;
    }
    if (Math.abs(selectionEnd.value.y - selectionStart.value.y) < minSize) {
      selectionEnd.value.y = selectionStart.value.y + minSize;
    }

    // 分离选择框更新和标签选中状态更新
    // 1. 选择框更新：使用requestAnimationFrame保持流畅动画，不使用节流
    // 添加防御性检查，确保即使isUpdatingSelectionBox被卡住也能继续更新
    if (!isUpdatingSelectionBox.value || (Date.now() - lastUpdateTime.value > 100)) {
      isUpdatingSelectionBox.value = true
      requestAnimationFrame(() => {
        updateSelectionBox()
        isUpdatingSelectionBox.value = false
      })
    }

    // 2. 标签选中状态更新：使用节流控制，减少性能消耗
    const currentTime = Date.now()
    if (!isUpdatingSelectedTokens.value && (currentTime - lastUpdateTime.value > throttleInterval)) {
      lastUpdateTime.value = currentTime
      isUpdatingSelectedTokens.value = true
      requestAnimationFrame(() => {
        updateSelectedTokens()
        isUpdatingSelectedTokens.value = false
      })
    }
  }
}

// 处理鼠标释放事件，结束框选 - 稳定版
const handleMouseUp = () => {
  // 清理潜在的框选状态
  isPotentialBoxSelection.value = false

  if (isSelecting.value) {
    // 先保存选中的标签数量，然后才结束框选模式
    const selectedCount = selectedTokens.value.length

    // 确保所有状态变量都被正确重置
    isSelecting.value = false
    isBoxSelectMode.value = false // 退出框选模式
    isUpdatingSelectionBox.value = false
    isUpdatingSelectedTokens.value = false

    // 移除选择框
    removeSelectionBox()

    // 如果有选中的标签，显示操作菜单
    if (selectedCount > 0) {
      showSelectionActionsMenu()
    }
  }
}

// 创建选择框元素 - 持久稳定版
const createSelectionBox = () => {
  try {
    // 先检查是否已经有选择框存在
    let selectionBox = document.getElementById(selectionBoxId)
    if (selectionBox) {
      // 如果存在，先移除它
      document.body.removeChild(selectionBox)
    }

    // 创建新的选择框
    selectionBox = document.createElement('div')
    selectionBox.id = selectionBoxId

    // 增强选择框的可见性，使用更醒目的样式
    // 颜色取插件主题变量（跟随 ComfyUI 调色板），无变量时回退到原蓝色
    const selRgb =
      getComputedStyle(document.getElementById('weilin_comfyui_tools_prompt_ui_div') || document.documentElement)
        .getPropertyValue('--weilin-prompt-ui-primary-color-rgb') || ''
    const selAccent = selRgb.trim() ? `rgb(${selRgb.trim()})` : '#4285f4'
    const selFill = selRgb.trim() ? `rgba(${selRgb.trim()}, 0.4)` : 'rgba(66, 133, 244, 0.4)'
    const selGlow = selRgb.trim() ? `rgba(${selRgb.trim()}, 0.6)` : 'rgba(66, 133, 244, 0.6)'
    selectionBox.style.cssText = `
      position: fixed;
      background-color: ${selFill};
      border: 2px dashed ${selAccent};
      box-shadow: 0 0 12px ${selGlow};
      pointer-events: none;
      z-index: 99999;
      transition: none;
      opacity: 1;
      display: block;
    `

    document.body.appendChild(selectionBox)
    updateSelectionBox()
  } catch (error) {
    console.error('创建选择框失败:', error)
    // 重置状态，确保后续操作不受影响
    isUpdatingSelectionBox.value = false
  }
}

// 更新选择框位置和大小 - 增强版
const updateSelectionBox = () => {
  try {
    let selectionBox = document.getElementById(selectionBoxId)
    // 如果选择框不存在，重新创建它
    if (!selectionBox && isSelecting.value) {
      createSelectionBox()
      selectionBox = document.getElementById(selectionBoxId)
      if (!selectionBox) return
    }

    const left = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const top = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const width = Math.abs(selectionEnd.value.x - selectionStart.value.x)
    const height = Math.abs(selectionEnd.value.y - selectionStart.value.y)

    // 确保选择框有足够的大小可见
    const minSize = 5
    const effectiveWidth = Math.max(width, minSize)
    const effectiveHeight = Math.max(height, minSize)

    if (selectionBox) {
      selectionBox.style.left = `${left}px`
      selectionBox.style.top = `${top}px`
      selectionBox.style.width = `${effectiveWidth}px`
      selectionBox.style.height = `${effectiveHeight}px`
    }
  } catch (error) {
    console.error('更新选择框失败:', error)
    // 重置状态，确保后续操作不受影响
    isUpdatingSelectionBox.value = false
  }
}

// 移除选择框元素
const removeSelectionBox = () => {
  try {
    const selectionBox = document.getElementById(selectionBoxId)
    if (selectionBox) {
      document.body.removeChild(selectionBox)
    }
  } catch (error) {
    console.error('移除选择框失败:', error)
  }
}

// 更新选中的标签索引（框选时使用）
const updateSelectedTokens = () => {
  selectedTokens.value = []

  const left = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const top = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const right = Math.max(selectionStart.value.x, selectionEnd.value.x)
  const bottom = Math.max(selectionStart.value.y, selectionEnd.value.y)

  // 获取所有类型的标签容器元素
  const tokenBoxes = document.querySelectorAll('.token-item-box')

  tokenBoxes.forEach((box, index) => {
    // 获取标签内部的实际显示元素
    const tokenElement = box.querySelector('.token-item, .lora-tag-icon, .newline-token, .tab-token')
    if (!tokenElement) return

    const rect = box.getBoundingClientRect()

    // 检查标签是否与选择框有交集
    const isInSelection = rect.right >= left && rect.left <= right && rect.bottom >= top && rect.top <= bottom

    if (isInSelection) {
      selectedTokens.value.push(index)
    }
  })

  // 应用选中样式
  applySelectedStyle()
}

// 应用选中标签的视觉效果
const applySelectedStyle = () => {
  // 获取所有类型的标签容器元素
  const tokenBoxes = document.querySelectorAll('.token-item-box')

  // 避免重复操作DOM，先记录需要更新的元素
  const toSelect = []
  const toDeselect = []

  tokenBoxes.forEach((box, index) => {
    if (selectedTokens.value.includes(index)) {
      toSelect.push(box)
    } else {
      toDeselect.push(box)
    }
  })

  // 批量更新DOM，减少重排重绘
  toSelect.forEach(box => {
    // 为整个标签容器添加选中类，通过CSS优先级确保显示在禁用样式之上
    box.classList.add('token-item-box-selected')
  })

  toDeselect.forEach(box => {
    // 移除视觉反馈
    box.classList.remove('token-item-box-selected')
    // 清除之前可能设置的内联样式
    box.style.border = ''
    box.style.boxShadow = ''
    // 只有记录过原始背景色的标签才恢复；
    // 其余标签的背景由 Vue :style 管理，清空后 Vue 不会重放（颜色会丢失变异常）
    if (box.dataset.originalBgColor !== undefined) {
      box.style.backgroundColor = box.dataset.originalBgColor
    }
  })
}

// 标签上右键：屏蔽浏览器菜单，弹出与框选后一致的操作菜单（复制/禁用/启用/删除）
const handleTokenContextMenu = (index, event) => {
  // 编辑输入框上右键：保留浏览器原生菜单（复制/粘贴等），事件不再向下拦截
  const t = event.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
    return;
  }
  event.preventDefault();

  // 已处于框选状态且右键的正是已选中的标签：再次右键取消框选（开关式），不弹菜单
  if (selectedTokens.value.length > 0 && selectedTokens.value.includes(index)) {
    clearSelectedTokens();
    return;
  }

  // 否则将其设为唯一选中（替换原有选中），并弹出操作菜单
  selectedTokens.value = [index];
  nextTick(() => applySelectedStyle());

  // 菜单定位到鼠标位置（弹在光标下方）
  selectionActionsPosition.value = {
    top: `${event.clientY + 8}px`,
    left: `${event.clientX}px`
  };
  showSelectionActions.value = true;

  // 点击外部关闭菜单（与框选菜单的行为一致）
  setTimeout(() => {
    document.addEventListener('click', closeSelectionActionsOnClickOutside);
  }, 0);
};

// 显示框选操作菜单
const showSelectionActionsMenu = () => {
  if (selectedTokens.value.length > 0) {
    // 计算选择区域的中心位置作为菜单显示位置
    const left = Math.min(selectionStart.value.x, selectionEnd.value.x)
    const top = Math.min(selectionStart.value.y, selectionEnd.value.y)
    const right = Math.max(selectionStart.value.x, selectionEnd.value.x)
    const bottom = Math.max(selectionStart.value.y, selectionEnd.value.y)

    // 设置菜单位置在选择区域中央
    selectionActionsPosition.value = {
      top: `${top - 50}px`,
      left: `${(left + right) / 2}px`
    }

    showSelectionActions.value = true

    // 添加点击外部关闭菜单的事件监听
    setTimeout(() => {
      document.addEventListener('click', closeSelectionActionsOnClickOutside)
    }, 0)
  }
}

// 复制选中的标签文本
const copySelectedTokens = () => {
  if (selectedTokens.value.length === 0) return

  // 按顺序获取选中标签的文本
  const sortedIndices = [...selectedTokens.value].sort((a, b) => a - b)
  const texts = sortedIndices.map(index => tokens.value[index].text)
  const combinedText = texts.join(', ')

  // 复制到剪贴板
  navigator.clipboard.writeText(combinedText).then(() => {
    // 可以添加一个简单的提示
    const tempMessage = document.createElement('div')
    tempMessage.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4caf50;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 999999;
    `
    tempMessage.textContent = '已复制到剪贴板'
    document.body.appendChild(tempMessage)

    setTimeout(() => {
      document.body.removeChild(tempMessage)
    }, 2000)
  })

  // 关闭菜单并清除选中状态
  closeSelectionActions()
}

// 收藏选中的标签到标签管理器：拼接文本后打开标签收藏对话框（与单标签收藏按钮同链路，
// favourItemRef.open(text, translate) → 选择分组保存）；有翻译的标签带上翻译，全无翻译传空串
const favoriteSelectedTokens = () => {
  if (selectedTokens.value.length === 0) return

  // 按顺序获取选中标签的文本与翻译（与复制按钮相同的拼接口径）
  const sortedIndices = [...selectedTokens.value].sort((a, b) => a - b)
  const combinedText = sortedIndices.map(index => tokens.value[index].text).join(', ')
  const combinedTranslate = sortedIndices
    .map(index => tokens.value[index].translate || '')
    .filter(t => t)
    .join(', ')

  // 先关闭菜单清除选中，再弹出标签收藏对话框（避免浮窗与对话框同屏叠加）
  closeSelectionActions()
  if (favourItemRef.value) {
    favourItemRef.value.open(combinedText, combinedTranslate)
  }
}

// 禁用选中的标签
const disableSelectedTokens = () => {
  if (selectedTokens.value.length === 0) return

  selectedTokens.value.forEach(index => {
    if (tokens.value[index] && !tokens.value[index].isHidden) {
      // 不修改标签文本，只设置隐藏状态（与双击禁用行为一致）
      tokens.value[index].isHidden = true
      tokens.value[index].hiddenHint = t('promptBox.hiddenHint') // 使用国际化提示
    }
  })

  updateInputText()
  finishPromptPutItHistory()

  // 关闭菜单并清除选中状态
  closeSelectionActions()
}

// 启用选中的标签
const enableSelectedTokens = () => {
  if (selectedTokens.value.length === 0) return

  selectedTokens.value.forEach(index => {
    if (tokens.value[index] && tokens.value[index].isHidden) {
      // 只需要清除隐藏状态，不需要恢复原始文本（与双击禁用行为一致）
      tokens.value[index].isHidden = false
      tokens.value[index].hiddenHint = ''
    }
  })

  updateInputText()
  finishPromptPutItHistory()

  // 关闭菜单并清除选中状态
  closeSelectionActions()
}

// 删除选中的标签（替代原来的showBulkDeleteConfirmation）
const deleteSelectedTokens = () => {
  if (selectedTokens.value.length > 0) {
    // 立即捕获待删除的索引快照，避免确认对话框期间选中状态被清空导致删除失效
    const indicesToDelete = [...selectedTokens.value]
    confirmDialogMessage.value = `确定要删除选中的 ${indicesToDelete.length} 个标签吗？`
    confirmDialogCallback = () => {
      bulkDeleteSelectedTokens(indicesToDelete)
    }
    showConfirmDialog.value = true
  }
}

const cancelConfirmDialog = () => {
  showConfirmDialog.value = false
  confirmDialogCallback = null
  // 取消删除时清除选中状态
  clearSelectedTokens()
}

const executeConfirmDialog = () => {
  showConfirmDialog.value = false
  if (confirmDialogCallback) {
    confirmDialogCallback()
    confirmDialogCallback = null
  }
}

// 关闭选择操作菜单
const closeSelectionActions = () => {
  showSelectionActions.value = false
  document.removeEventListener('click', closeSelectionActionsOnClickOutside)
  clearSelectedTokens()
}

// 点击外部关闭选择操作菜单
const closeSelectionActionsOnClickOutside = (event) => {
  // 使用框选操作菜单独有的类名定位，避免与悬浮控制栏（同样使用 .token-controls）混淆。
  // 否则点击菜单内的「删除」等按钮会被误判为「外部点击」而清空选中，导致删除失效。
  if (event.target.closest && event.target.closest('.weilin-selection-actions-menu')) return
  const actionsMenu = document.querySelector('.weilin-selection-actions-menu')
  if (actionsMenu && !actionsMenu.contains(event.target)) {
    closeSelectionActions()
  }
}

// 批量删除选中的标签
// indices 为可选参数：传入则在调用时锁定待删除索引，避免选中状态被提前清空导致删除失效
const bulkDeleteSelectedTokens = (indices) => {
  const sourceIndices = (indices && indices.length > 0) ? indices : selectedTokens.value
  if (sourceIndices.length === 0) return

  // 确保按照从后往前的顺序删除，避免索引偏移
  const sortedIndices = [...sourceIndices].sort((a, b) => b - a)

  // 先删除tokens数组中的元素（防御越界）
  sortedIndices.forEach(index => {
    if (index >= 0 && index < tokens.value.length) {
      tokens.value.splice(index, 1)
    }
  })

  // 然后更新输入文本
  updateInputText()
  finishPromptPutItHistory()

  // 清除选中状态
  clearSelectedTokens()
}

// 清除选中的标签
const clearSelectedTokens = () => {
  // 处理所有带有选中类的标签，确保移除所有选中样式
  const selectedBoxes = document.querySelectorAll('.token-item-box-selected')
  selectedBoxes.forEach(box => {
    // 移除选中类
    box.classList.remove('token-item-box-selected')
    // 清除可能的内联样式
    box.style.border = ''
    box.style.boxShadow = ''
    // 只有记录过原始背景色的标签才恢复；其余由 Vue :style 管理，不能清空（清空后颜色丢失）
    if (box.dataset.originalBgColor !== undefined) {
      box.style.backgroundColor = box.dataset.originalBgColor
    }
  })

  // 清空选中状态数组
  selectedTokens.value = []

  // 如果操作菜单可见，也关闭它
  if (showSelectionActions.value) {
    showSelectionActions.value = false
    document.removeEventListener('click', closeSelectionActionsOnClickOutside)
  }
}

// 处理点击空白区域取消框选状态
const handleClickToClearSelection = (event) => {
  // 只有当有选中项时才需要处理
  if (selectedTokens.value.length === 0) return;

  // 检查点击目标是否在标签容器内且不是标签本身、控制元素或操作菜单
  const tokenItem = event.target.closest('.token-item-box, .token-item, .token-controls, .delete-btn, .weight-control, .bracket-btn, .translate-button, .tag-tips-box');
  const tokensContainer = tokensContainerRef.value;

  // 如果点击的是文本框或完全在标签容器外部的空白区域，则清除选中状态
  if (event.target === inputAreaRef.value ||
    (!tokenItem && (!tokensContainer || !tokensContainer.contains(event.target)))) {
    clearSelectedTokens();
  }
}

// 组件挂载时添加事件监听
onMounted(() => {
  // 添加点击事件监听，点击空白处或文本框时清除框选状态
  // （点击外部关闭自动补全由上方 onMounted 的 handleClickOutside 负责，此处勿重复注册）
  document.addEventListener('click', handleClickToClearSelection);
  // 滚动（捕获模式，覆盖所有滚动容器）/窗口缩放时让搜索补全下拉跟随输入框
  window.addEventListener('scroll', handleViewportChangeForSuggestions, true)
  window.addEventListener('resize', handleViewportChangeForSuggestions)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // 移除 ESC 逐层关闭浮层的监听（capture 须与注册时一致）
  document.removeEventListener('keydown', handleGlobalEscape, true)
  // 移除点击清除框选的事件监听
  document.removeEventListener('click', handleClickToClearSelection)
  if (historyTimer.value) {
    clearTimeout(historyTimer.value);
  }
  window.removeEventListener('message', handleMessage)
  // 移除搜索补全下拉的滚动/缩放跟随监听（scroll 须与注册时的 capture 参数一致）
  window.removeEventListener('scroll', handleViewportChangeForSuggestions, true)
  window.removeEventListener('resize', handleViewportChangeForSuggestions)
  const textarea = inputAreaRef.value;
  if (textarea) {
    textarea.removeEventListener('keyup', updateAutocompletePosition);
    textarea.removeEventListener('click', updateAutocompletePosition);
    textarea.removeEventListener('input', updateAutocompletePosition);
    textarea.removeEventListener('click', closeAutocompleteOnCaretMove);
  }
  // 移除框选功能的事件监听
  if (tokensContainerRef.value) {
    tokensContainerRef.value.removeEventListener('mousedown', handleMouseDown)
    tokensContainerRef.value.removeEventListener('mousemove', handleMouseMove)
    tokensContainerRef.value.removeEventListener('mouseup', handleMouseUp)
    tokensContainerRef.value.removeEventListener('mouseleave', handleMouseUp)
  }
  // 清理选择框
  removeSelectionBox()
})

// 处理消息
const handleMessage = (event) => {
  if (!isTrustedMessage(event)) return
  // Lora 管理器里换了本地封面 → 失效 wlr 缩略图缓存并重新预取（否则堆/悬停缩略图一直是旧图）
  if (event.data.type === 'weilin_prompt_ui_lora_cover_updated') {
    refreshLoraCoverForFile(event.data.file)
    return
  }
  if (event.data.type === 'weilin_prompt_ui_insertTag') {
    // 在输入框末尾添加标签文本
    const currentText = inputText.value
    const tagText = event.data.tagText

    // 检查当前文本是否为空或是否以空格结尾
    if (currentText === '') {
      inputText.value = tagText
    } else if (currentText.endsWith(' ')) {
      inputText.value = currentText + ', ' + tagText + ',';
    } else {
      inputText.value = currentText + ', ' + tagText + ',';
    }

    lastInputValue.value = inputText.value; // 更新上一次的输入内容
    // 触发输入事件以更新词组
    processInput()
  } else if (event.data.type === 'weilin_prompt_ui_user_history_tag') {
    const tagText = event.data.tagText
    tempInputText.value = tagText
    setPromptText(tagText)
  } else if (event.data.type === 'weilin_prompt_ui_refresh_all_data') {

  } else if (event.data.type === 'weilin_prompt_ui_translate_setting') {
    initTranslate()
  } else if (event.data.type === 'weilin_prompt_ui_selectLora') {
    // console.log(event.data.lora)
    if (event.data.lora.loraWorks != undefined && event.data.lora.loraWorks.length > 0) {
      // 在输入框末尾添加标签文本
      const currentText = inputText.value
      const tagText = event.data.lora.loraWorks

      // 检查当前文本是否为空或是否以空格结尾
      if (currentText === '') {
        inputText.value = tagText
      } else if (currentText.endsWith(' ')) {
        inputText.value = currentText + ', ' + tagText + ',';
      } else {
        inputText.value = currentText + ', ' + tagText + ',';
      }

      lastInputValue.value = inputText.value; // 更新上一次的输入内容
      // 触发输入事件以更新词组
      processInput()
    }
  } else if (event.data.type === 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id_go_random_response') {
    onClickLocalTemplateRandomTag(event.data.data)
  } else if (event.data.type === 'weilin_prompt_ui_addLoraTag_inner') {
    // console.log(event.data.lora)
    if (event.data.lora.loraWorks != undefined && event.data.lora.loraWorks.length > 0) {
      // 在输入框末尾添加标签文本
      const currentText = inputText.value
      const tagText = event.data.lora.tag + (event.data.lora.loraWorks === '' ? "" : ", " + event.data.lora.loraWorks)

      // 检查当前文本是否为空或是否以空格结尾
      if (currentText === '') {
        inputText.value = tagText
      } else if (currentText.endsWith(' ')) {
        inputText.value = currentText + ', ' + tagText + ',';
      } else {
        inputText.value = currentText + ', ' + tagText + ',';
      }

      lastInputValue.value = inputText.value; // 更新上一次的输入内容
      // 触发输入事件以更新词组
      processInput()
    } else {
      // 在输入框末尾添加标签文本
      const currentText = inputText.value
      const tagText = event.data.lora.tag

      // 检查当前文本是否为空或是否以空格结尾
      if (currentText === '') {
        inputText.value = tagText
      } else if (currentText.endsWith(' ')) {
        inputText.value = currentText + ', ' + tagText + ',';
      } else {
        inputText.value = currentText + ', ' + tagText + ',';
      }

      lastInputValue.value = inputText.value; // 更新上一次的输入内容
      // 触发输入事件以更新词组
      processInput()
    }
  } else if (event.data.type === 'weilin_prompt_ui_lora_detail_closed') {
    // lora 详情窗关闭：解除悬浮栏钉住（钉住是为"详情窗/信息浮窗存在时不自动消失"，
    // 若浮窗同时开着则保留钉住），并触发一次常规的隐藏判定（不动 isOverTag——
    // 鼠标此刻可能悬停在标签上，判定内部会自行排除）
    loraDetailOpenedForCover = false
    if (!showCoverCard.value) {
      controlsPinned.value = false
      pinnedTagIndex = null
      scheduleHideCheck()
    }
  } else if (event.data.type === 'weilin_prompt_ui_lora_stack_sync_changed') {
    // lora堆卡片权重同步开关被用户切换 → 更新本端 map（悬浮栏再悬停该 lora 时状态一致）
    if (event.data.lora || event.data.name) {
      loraSyncMap.value = { ...loraSyncMap.value, [wlrKey(event.data.lora || event.data.name)]: !!event.data.value };
      persistLoraSyncMap();
    }
  }
}

const initTranslate = async () => {
  const savedSourceLanguage = localStorage.getItem('weilin_prompt_ui_sourceLanguage') || 'english';
  const savedTargetLanguage = localStorage.getItem('weilin_prompt_ui_targetLanguage') || 'chinese_simplified';
  if (!localStorage.getItem('weilin_prompt_ui_sourceLanguage')) {
    localStorage.setItem('weilin_prompt_ui_sourceLanguage', savedSourceLanguage);
  }
  if (!localStorage.getItem('weilin_prompt_ui_targetLanguage')) {
    localStorage.setItem('weilin_prompt_ui_targetLanguage', savedTargetLanguage);
  }
  if (savedSourceLanguage !== 'auto') {
    // translate.language.setLocal(savedSourceLanguage);
  }
  // translate.language.setDefaultTo(savedTargetLanguage);

  // 解决common命名空间翻译未生效问题：强制触发Vue I18n更新
  await nextTick();
}

const translateFunction = (texts, token) => {
  // if (localStorage.getItem('weilin_prompt_ui_translater_setting') == 'network') {
  //   translate.request.translateText(texts, function (data) {
  //     if (data.result > 0) {
  //       const translatedText = data.text.map(item => item.replace(/[\[\]“”]/g, '')).join(', ');
  //       token.translate = translatedText
  //     }
  //     //打印翻译结果
  //     // console.log(data);
  //   });
  // } else if (localStorage.getItem('weilin_prompt_ui_translater_setting') == 'translater') {
  translatorApi.translaterText('', texts).then(res => {
    // console.log(res)
    if (res.data.length > 0) {
      token.translate = res.data;
    }
  })
  // } else {

  //   let needTranslateData = { index: token.id, text: token.text, translate: '' }
  //   const jsonString = JSON.stringify(needTranslateData)

  //   translatorApi.translaterText(jsonString, "").then(res => {
  //     if (res) {
  //       if (res.data) {
  //         const jsonData = JSON.parse(res.data)
  //         // console.log(jsonData)
  //         token.translate = jsonData.translate
  //       }
  //     }
  //   })
  //   // translatorApi.translaterText(texts).then(res => {
  //   //   // console.log(res)
  //   //   if (res.text.length > 0) {
  //   //     token.translate = res.text;
  //   //   }
  //   // })
  // }
}

const finishTranslateEnter = () => {

  // API翻译
  translatorApi.translaterInputText('', translateText.value).then(res => {
    // console.log(res)
    if (res.data.length > 0) {
      tokens.value.push({
        text: res.data,
        translate: translateText.value,
        isPunctuation: false,
        isEditing: false,
        isHidden: false,
        color: ''
      });
      translateText.value = ''
      updateInputText()
    }
  })

  // if (localStorage.getItem('weilin_prompt_ui_translater_setting') == 'network') {
  //   // const restran = translate.language.recognition(translateText.value)
  //   // var obj = {
  //   //   from: restran.languageName,
  //   //   to: 'english',
  //   //   texts: [translateText.value]
  //   // }

  //   // translate.request.translateText(obj, function (data) {
  //   //   if (data.result > 0) {
  //   //     const translatedText = data.text.map(item => item.replace(/[\[\]“”]/g, '')).join(', ');
  //   //     tokens.value.push({
  //   //       text: translatedText,
  //   //       translate: translateText.value,
  //   //       isPunctuation: false,
  //   //       isEditing: false,
  //   //       isHidden: false,
  //   //       color: ''
  //   //     });
  //   //     translateText.value = ''
  //   //     updateInputText()
  //   //   }
  //   //   //打印翻译结果
  //   //   // console.log(data);
  //   // });
  // } else if (localStorage.getItem('weilin_prompt_ui_translater_setting') == 'translater') {
  //   // API翻译
  //   translatorApi.translaterInputText('', translateText.value).then(res => {
  //     // console.log(res)
  //     if (res.text.length > 0) {
  //       tokens.value.push({
  //         text: res.data,
  //         translate: translateText.value,
  //         isPunctuation: false,
  //         isEditing: false,
  //         isHidden: false,
  //         color: ''
  //       });
  //       translateText.value = ''
  //       updateInputText()
  //     }
  //   })

  // } else {

  //   let needTranslateData = { text: translateText.value, translate: '' }
  //   const jsonString = JSON.stringify(needTranslateData)

  //   translatorApi.translaterInputText(jsonString, "").then(res => {
  //     if (res) {
  //       if (res.data) {
  //         const jsonData = JSON.parse(res.data)
  //         // console.log(jsonData)
  //         // token.translate = jsonData.translate

  //         tokens.value.push({
  //           text: jsonData.translate,
  //           translate: translateText.value,
  //           isPunctuation: false,
  //           isEditing: false,
  //           isHidden: false,
  //           color: ''
  //         });
  //         translateText.value = ''
  //         updateInputText()
  //       }
  //     }
  //   })

  //   // translatorApi.translaterInputText(translateText.value).then(res => {
  //   //   // console.log(res)
  //   //   if (res.text.length > 0) {
  //   //     tokens.value.push({
  //   //       text: res.text,
  //   //       translate: translateText.value,
  //   //       isPunctuation: false,
  //   //       isEditing: false,
  //   //       isHidden: false,
  //   //       color: ''
  //   //     });
  //   //     translateText.value = ''
  //   //     updateInputText()
  //   //   }
  //   // })
  // }

}


// 自动补全功能

const onBlur = () => {
  // 添加延迟处理，避免与自动补全点击冲突
  setTimeout(() => {
    if (!showAutocomplete.value) {
      lastInputValue.value = inputText.value; // 更新上一次的输入内容
      processInput();
    }
  }, 100);
}

// 提取补全逻辑到单独的函数
// 性能优化：①防抖（停止输入 150ms 才发请求，避免逐键请求）②请求序号丢弃过期响应
// ③结果缓存（重复前缀零延迟显示）④去掉原 50ms 的人为显示延迟
const AUTOCOMPLETE_DEBOUNCE_MS = 150
const AUTOCOMPLETE_CACHE_MAX = 100
const AUTOCOMPLETE_EMBEDDING_MAX = 50 // embeddings 过滤结果的展示上限
const AUTOCOMPLETE_EMBEDDING_MIX_MAX = 10 // 普通输入混入 embedding 候选的上限
let autocompleteDebounceTimer = null
let autocompleteRequestSeq = 0 // 请求序号，用于丢弃过期响应
const autocompleteCache = new Map() // query -> results

// ===== embeddings 补全 =====
// 数据源主用插件自身端点 get_embeddings_list（与标签库接口同链路，可达性与 tag 补全一致），
// 失败时回退 ComfyUI 原生 /api/embeddings（/embeddings 可能被第三方扩展的页面路由占用，勿用）。
// 返回带子目录的完整名字（如 "123/anna1"），原样插入即与后端 folder_paths 列表精确匹配。
let embeddingsListCache = null
let embeddingsFetchFailedAt = 0 // 失败冷却：30s 内不重试，避免失败被永久缓存为空列表后每次输入都静默失败
const fetchEmbeddingsList = async () => {
  if (embeddingsListCache !== null) return embeddingsListCache
  if (Date.now() - embeddingsFetchFailedAt < 30000) return []
  try {
    let list = null
    try {
      const res = await autocompleteApi.getEmbeddingsList()
      list = Array.isArray(res.data) ? res.data : null
    } catch (e) {
      console.warn('[WeiLin] 插件端点获取 embeddings 失败，回退原生 /api/embeddings:', e)
    }
    if (list === null) {
      const res = await fetch('/api/embeddings')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const raw = await res.json()
      list = Array.isArray(raw) ? raw : []
    }
    embeddingsListCache = list.filter(n => typeof n === 'string')
    if (embeddingsListCache.length === 0) {
      console.warn('[WeiLin] embeddings 列表为空——请确认 ComfyUI 的 models/embeddings 目录非空')
    }
  } catch (e) {
    console.warn('[WeiLin] 获取 embeddings 列表失败:', e);
    embeddingsFetchFailedAt = Date.now()
    return []
  }
  return embeddingsListCache
}

// 输入 embedding:（兼容全角冒号 embedding：）时本地过滤 embeddings 列表（不发 tag 请求，无需防抖）
// 比对统一用正斜杠归一化（列表原名带反斜杠子目录如 "123\anna1"），插入保留原名
const buildEmbeddingAutocomplete = async (filter) => {
  const list = await fetchEmbeddingsList()
  const matched = list
    .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(filter))
    .slice(0, AUTOCOMPLETE_EMBEDDING_MAX)
    .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
  await applyAutocompleteResults(matched)
}

// 普通输入混入 embeddings 候选：tag 库结果尾部附加包含输入词的 embedding（同款过滤/映射）
const buildEmbeddingTail = async (lowerQuery) => {
  const list = await fetchEmbeddingsList()
  return list
    .filter(name => name.replace(/\\/g, '/').toLowerCase().includes(lowerQuery))
    .slice(0, AUTOCOMPLETE_EMBEDDING_MIX_MAX)
    .map(name => ({ text: 'embedding:' + name, desc: 'embedding', isEmbedding: true }))
}


// 去重（74.23）：按候选文本小写归一化，保留首个出现——tag 结果在前、embedding 尾附在后
// 的顺序不变；标签库重复条目 / 大小写变体只展示一次
const dedupeAutocompleteResults = (results) => {
  const seen = new Set();
  return (results || []).filter(item => {
    if (!item || !item.text) return false;
    const key = String(item.text).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const applyAutocompleteResults = async (results) => {
  autocompleteResults.value = dedupeAutocompleteResults(results);
  await calculateAutocompletePosition();
  saveAutoCompleteWidth.value = localStorage.getItem('weilin_prompt_ui_auto_box_width') || 450
  saveAutoCompleteHeight.value = localStorage.getItem('weilin_prompt_ui_auto_box_height') || 350
  showAutocomplete.value = autocompleteResults.value.length > 0;
  selectedAutocompleteIndex.value = 0; // 重置选中索引
}

const triggerAutocomplete = (inputValue) => {
  // 处理特殊格式 - 移除了圆括号
  let cleanedTrSegment = inputValue.replace(/[\[\]{}]/g, '').trim();

  // embedding 前缀检测必须在 extractText 之前：
  // extractText 会把 "embedding:123\anna1"（冒号后跟数字）误判为权重语法并截掉冒号后的内容
  // 兼容全角冒号（embedding：），中文输入法下冒号易被打成全角导致前缀检测失败；
  // 裸词 "embedding"（还没打冒号）也直接列出 embedding 候选，不必等冒号敲下
  // 裸词修复（74.22）：旧正则要求整段恰等于 "embedding" 才命中——裸词弹出的全量列表
  // 在继续输入名字第一个字符后（embeddingXxx）立刻失配掉回 tag 路径，列表被替换，
  // 实际上仍必须打冒号才能筛选。现放宽为 "embedding" 前缀 + 可选冒号 + 任意后缀，
  // 裸词后续输入持续按后缀过滤 embedding 列表
  const embeddingPrefixMatch = cleanedTrSegment.match(/^embedding[:：]?(.*)$/i);
  if (embeddingPrefixMatch) {
    if (autocompleteDebounceTimer) {
      clearTimeout(autocompleteDebounceTimer);
      autocompleteDebounceTimer = null;
    }
    autocompleteRequestSeq++; // 作废在途的 tag 补全请求
    buildEmbeddingAutocomplete((embeddingPrefixMatch[1] || '').trim().toLowerCase());
    return;
  }

  const text = extractText(cleanedTrSegment)

  // 清除输入值的前后空格
  const trimmedInput = text.trim();

  // 如果输入为空或过长：立即隐藏，并作废在途请求/防抖
  if (!trimmedInput || trimmedInput.length > 20) {
    if (autocompleteDebounceTimer) {
      clearTimeout(autocompleteDebounceTimer);
      autocompleteDebounceTimer = null;
    }
    autocompleteRequestSeq++; // 使在途响应作废
    showAutocomplete.value = false;
    return;
  }

  const lowerInput = trimmedInput.toLowerCase();

  // 命中缓存：直接显示，不发请求
  if (autocompleteCache.has(lowerInput)) {
    autocompleteRequestSeq++; // 作废在途请求
    applyAutocompleteResults(autocompleteCache.get(lowerInput));
    return;
  }

  // 防抖：停止输入一段时间后才发起请求
  if (autocompleteDebounceTimer) {
    clearTimeout(autocompleteDebounceTimer);
  }
  autocompleteDebounceTimer = setTimeout(async () => {
    autocompleteDebounceTimer = null;
    const seq = ++autocompleteRequestSeq;
    try {
      const res = await autocompleteApi.getAutocomplete(String(lowerInput));
      if (seq !== autocompleteRequestSeq) return; // 过期响应，丢弃
      const results = res.data || [];
      // 混入 embedding 候选（普通输入也能看到 embedding；缓存同存合并结果，命中缓存时行为一致）
      const embeddingTail = await buildEmbeddingTail(lowerInput);
      if (seq !== autocompleteRequestSeq) return; // 二次检查（fetch 缓存未命中时 await 有窗口）
      const mergedResults = results.concat(embeddingTail);
      // 写入缓存（超容量时淘汰最早的条目）
      if (autocompleteCache.size >= AUTOCOMPLETE_CACHE_MAX) {
        const firstKey = autocompleteCache.keys().next().value;
        autocompleteCache.delete(firstKey);
      }
      autocompleteCache.set(lowerInput, mergedResults);
      await applyAutocompleteResults(mergedResults);
    } catch (error) {
      console.error('Autocomplete error:', error);
      if (seq === autocompleteRequestSeq) {
        showAutocomplete.value = false;
      }
    }
  }, AUTOCOMPLETE_DEBOUNCE_MS);
};

// 处理键盘事件
const handleKeydown = (event) => {
  if (showAutocomplete.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      selectedAutocompleteIndex.value = Math.min(selectedAutocompleteIndex.value + 1, autocompleteResults.value.length - 1);
      scrollToSelectedItem();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selectedAutocompleteIndex.value = Math.max(selectedAutocompleteIndex.value - 1, 0);
      scrollToSelectedItem();
    } else if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      selectAutocomplete(selectedAutocompleteIndex.value, null, true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAutocomplete();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      // 在输入框内左右/首尾移动光标（切换输入位置）时关闭补全；不拦截按键，光标正常移动
      closeAutocomplete();
    }
  }
};

// 添加滚动到选中项的函数
const scrollToSelectedItem = () => {
  nextTick(() => {
    const selectedItem = selectedItemRef.value;
    // 滚动容器为内层 .autocomplete-scroll（外层只负责定位与外观，
    // 关闭按钮置于滚动区外，滚动时固定在右上角）
    const container = autocompleteContainerRef.value?.querySelector('.autocomplete-scroll');
    if (selectedItem && container) {
      // 获取容器和选中项的位置信息
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selectedItem.getBoundingClientRect();

      // 判断选中项是否在可视区域内
      const isAbove = selectedRect.top < containerRect.top;
      const isBelow = selectedRect.bottom > containerRect.bottom;

      if (isAbove) {
        // 如果选中项在可视区域上方，滚动到顶部
        container.scrollTop = container.scrollTop + (selectedRect.top - containerRect.top);
      } else if (isBelow) {
        // 如果选中项在可视区域下方，滚动到底部
        container.scrollTop = container.scrollTop + (selectedRect.bottom - containerRect.bottom);
      }
    }
  });
};

// 计算调整后的自动补全位置
const adjustedAutocompletePosition = computed(() => {
  if (!parentCneterBox.value) return { left: autocompletePosition.value.left };

  const parentWidth = parentCneterBox.value.offsetWidth;
  saveAutoCompleteWidth.value = localStorage.getItem('weilin_prompt_ui_auto_box_width') || 450
  const autocompleteWidth = saveAutoCompleteWidth.value;
  let left = autocompletePosition.value.left;

  // 检查是否会超出右侧边界
  if (left + autocompleteWidth > parentWidth) {
    // 将窗口贴在右侧边界
    left = parentWidth - autocompleteWidth;
  }

  // 确保不会超出左侧边界
  if (left < 0) {
    left = 0;
  }

  return { left };
});


const selectAutocomplete = (index, event) => {
  // 如果有event参数，阻止默认行为和事件冒泡
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!autocompleteResults.value[index]) return;

  showAutocomplete.value = false;

  // 获取当前输入框的选区位置
  const cursorPosition = inputAreaRef.value.selectionStart;
  const cursorEnd = inputAreaRef.value.selectionEnd;

  // 获取当前输入文本
  const currentText = inputText.value;

  // 处理补全文本格式转换
  const autocompleteItem = autocompleteResults.value[index];
  let tagText = autocompleteItem.text;

  // 应用所有格式转换（embedding 文件名不做任何转换：
  // 下划线转空格、括号转义等都会破坏文件名，导致 embedding 引用失效）
  if (!autocompleteItem.isEmbedding) {
    if (localStorage.getItem('weilin_prompt_ui_comma_conversion') !== 'false') {
      tagText = tagText.replace(/，/g, ',');
    }
    if (localStorage.getItem('weilin_prompt_ui_period_conversion') !== 'false') {
      tagText = tagText.replace(/。/g, '.');
    }
    if (localStorage.getItem('weilin_prompt_ui_bracket_conversion') !== 'false') {
      tagText = tagText
        .replace(/【/g, '[')
        .replace(/】/g, ']')
        .replace(/（/g, '(')
        .replace(/）/g, ')');
    }
    if (localStorage.getItem('weilin_prompt_ui_angle_bracket_conversion') !== 'false') {
      tagText = tagText
        .replace(/《/g, '<')
        .replace(/》/g, '>');
    }
    if (localStorage.getItem('weilin_prompt_ui_underscore_to_bracket') === 'true') {
      tagText = tagText.replace(/_/g, ' ');
    }

    // 自动转义标签中的括号
    if (localStorage.getItem('weilin_prompt_ui_bracket_escape') === 'true') {
      tagText = tagText.replace(/\(([^)]+)\)/g, '\\($1\\)');
    }
  }

  // 确定要替换的范围
  let replaceStart = cursorPosition;
  let replaceEnd = cursorEnd;

  // 向前查找单词边界
  while (replaceStart > 0 &&
    !/[,\s]/.test(currentText[replaceStart - 1])) {
    replaceStart--;
  }

  // 向后查找单词边界
  while (false && replaceEnd < currentText.length &&
    !/[,\s]/.test(currentText[replaceEnd])) {
    replaceEnd++;
  }

  // 执行替换 - 始终在tag后添加逗号和空格，光标在分隔符后
  let newText = currentText.substring(0, replaceStart) + tagText + ', ' + currentText.substring(replaceEnd);

  // 计算新光标位置 - 补全完成后光标在逗号和空格后面
  const newCursorPosition = replaceStart + tagText.length + 2; // +2表示逗号和空格

  // 更新输入文本
  inputText.value = newText;
  lastInputValue.value = newText;

  // 触发输入处理
  processInput();

  // 恢复光标位置
  nextTick(() => {
    if (inputAreaRef.value) {
      inputAreaRef.value.selectionStart = newCursorPosition;
      inputAreaRef.value.selectionEnd = newCursorPosition;
    }
  });
};

// 关闭补全窗口
const closeAutocomplete = () => {
  showAutocomplete.value = false;
};

const setPromptText = (text) => {
  // console.log(text)
  if (text.length > 0) {
    try {
      const jsonStr = JSON.parse(text)

      inputText.value = jsonStr.prompt
      lastInputValue.value = inputText.value; // 更新上一次的输入内容

      if (jsonStr.lora && jsonStr.lora != "") {
        selectedLoras.value = jsonStr.lora
      }

      if (jsonStr.temp_prompt && jsonStr.temp_prompt != "") {
        // console.log(jsonStr.temp_prompt)
        const tempDataJson = jsonStr.temp_prompt
        // console.log(tempDataJson)
        let isOldVersion = false
        if (tempDataJson.tokens && tempDataJson.tokens.length > 0 && tempDataJson.tokens != "") {
          tokens.value = tempDataJson.tokens
          isOldVersion = true
        }
        if (tempDataJson.lora && tempDataJson.lora.length > 0 && tempDataJson.lora != "") {
          selectedLoras.value = tempDataJson.lora
          isOldVersion = true
        }

        if (!isOldVersion && tempDataJson.length > 0 && tempDataJson != "") {
          tokens.value = tempDataJson
        }

      }

      if (jsonStr.temp_lora && jsonStr.temp_lora.length > 0 && jsonStr.temp_lora != "") {
        const tempDataJson = jsonStr.temp_lora
        selectedLoras.value = tempDataJson
      }

      processInput()
    } catch (error) {
      // console.log('读取数据错误：', error)
      message({ type: "warn", str: 'promptBox.settings.errorPrompt' });
    }
  }
}

// 拖拽状态管理
const isDragging = ref(false);
const dragStartIndex = ref(null);
const draggedTokens = ref([]); // 存储被批量拖动的标签索引
// 容器引用 tokensContainerRef 已在上方声明（与框选逻辑共用），模板 ref 自动绑定

// 拖拽插入指示线（x/y/height 为相对容器的坐标）
const dropIndicator = ref({ show: false, x: 0, y: 0, height: 0 });

// 最近一次悬停判定的落点（index 为当前数组索引，isAfter 表示落在标签右半区）
let pendingDropTarget = null;

// 最近一次 dragover 的鼠标位置（用于 dragend 兜底判断松手位置）
let lastDragPoint = null;

// 存储当前拖拽操作的临时状态
let dragTempState = null;

// 隐藏插入指示线并清空落点记录
const hideDropIndicator = () => {
  dropIndicator.value = { show: false, x: 0, y: 0, height: 0 };
  pendingDropTarget = null;
};

// 初始化拖拽状态
const initializeDragState = (index, useMultipleSelection = false) => {
  // 重置所有拖拽相关状态
  isDragging.value = true;
  dragStartIndex.value = null;
  draggedTokens.value = [];

  if (useMultipleSelection && selectedTokens.value.length > 1 && selectedTokens.value.includes(index)) {
    // 批量拖拽模式
    draggedTokens.value = [...selectedTokens.value].sort((a, b) => a - b);
  } else {
    // 单个拖拽模式
    selectedTokens.value = [];
    dragStartIndex.value = index;
  }

  // 记录被拖动元素的对象引用（对象身份在重排后保持不变，用于定位与选中态映射）
  dragTempState = {
    isBatch: draggedTokens.value.length > 0,
    draggedItems: draggedTokens.value.length > 0
      ? draggedTokens.value.map(i => tokens.value[i])
      : [tokens.value[index]]
  };
};

// 滚轮增减权重值：悬停在输入框上即可滚轮调节，无需先点击聚焦
// which: 'weight' 普通权重 | 'loraModel' Lora模型权重 | 'loraText' Lora文本权重
const adjustWeightByWheel = (event, which) => {
  if (isDragging.value || mouseDragState.active) return;
  event.preventDefault(); // 阻止滚轮滚动页面
  const targetRef = which === 'weight'
    ? weightValue
    : (which === 'loraModel' ? loraModelWeight : loraTextWeight);
  const step = event.deltaY > 0 ? -0.1 : 0.1;
  const current = parseFloat(targetRef.value);
  const base = Number.isFinite(current) ? current : 1;
  targetRef.value = Math.round((base + step) * 10) / 10;
  if (which === 'weight') {
    applyWeight();
  } else {
    // 滚轮改权重同样走同步联动
    syncLoraWeights(which === 'loraModel' ? 'model' : 'text');
    applyLoraWeights();
  }
};

// ============ 标签搜索 ============
const tagSearchQuery = ref('')
const searchJumpIndex = ref(-1)

// 补全建议（{ 原文, 译文 } 对象数组，按原文去重后最多 8 条；下拉同时显示原文与译文）
const tagSearchSuggestions = ref([])
const tagSearchSuggestionIndex = ref(-1)
const tagSearchSuggestionPos = ref({ top: 0, left: 0 })

// 匹配的标签索引（匹配原文或译文，忽略大小写）
const searchMatchedIndices = computed(() => {
  const q = tagSearchQuery.value.trim().toLowerCase()
  if (!q) return []
  return tokens.value.reduce((acc, token, i) => {
    const text = (token.text || '').toLowerCase()
    const translate = (token.translate || '').toLowerCase()
    if (text.includes(q) || translate.includes(q)) acc.push(i)
    return acc
  }, [])
})
const searchMatchCount = computed(() => searchMatchedIndices.value.length)

// 命中/淡出判断（供 token-item-box 的 class 绑定使用）
const isSearchHit = (index) => searchMatchedIndices.value.includes(index)
const isSearchDim = (index) => !!tagSearchQuery.value.trim() && !isSearchHit(index)

// 输入时生成补全建议，并以下拉框定位到输入框正下方
const onTagSearchInput = () => {
  searchJumpIndex.value = -1
  updateTagSearchSuggestionPos()
  const q = tagSearchQuery.value.trim().toLowerCase()
  if (!q) {
    tagSearchSuggestions.value = []
    tagSearchSuggestionIndex.value = -1
    return
  }
  const seen = new Set()
  const list = []
  tokens.value.forEach(token => {
    const text = (token.text || '').trim()
    if (!text || text === '\n' || text === '\t') return
    const translate = (token.translate || '').trim()
    const lower = text.toLowerCase()
    // 补全建议为 { 原文, 译文 }：匹配同时纳入原文与译文（与搜索匹配一致），下拉显示原文+译文
    if ((lower.includes(q) || (translate && translate.toLowerCase().includes(q))) && !seen.has(lower)) {
      seen.add(lower)
      list.push({ text, translate })
    }
  })
  tagSearchSuggestions.value = list.slice(0, 8)
  tagSearchSuggestionIndex.value = -1
}

// 用输入框的实际屏幕位置定位补全下拉（fixed 定位，bottom 值使其向上展开）
const updateTagSearchSuggestionPos = () => {
  const input = document.querySelector('.tag-search-input')
  if (!input) return
  const r = input.getBoundingClientRect()
  // bottom = 视口高度 - 输入框顶部 y，让下拉贴着输入框顶部向上生长
  tagSearchSuggestionPos.value = { bottom: window.innerHeight - r.top + 4, left: r.left }
}

// 页面滚动/窗口缩放时补全下拉跟随输入框重新定位：
// 下拉是 fixed 定位（相对视口静止），输入框却随页面滚动移动，
// 不重算的话下拉会与输入框错位（表现为"跟随屏幕滚动上下移动"）
const handleViewportChangeForSuggestions = () => {
  if (tagSearchSuggestions.value.length > 0) {
    updateTagSearchSuggestionPos()
  }
}

const closeTagSearchSuggestions = () => {
  tagSearchSuggestions.value = []
  tagSearchSuggestionIndex.value = -1
}

// 选择补全项：填入标签原文并跳到第一个匹配（下拉项显示原文+译文，选中只取原文）
const selectTagSearchSuggestion = (s) => {
  tagSearchQuery.value = s.text
  closeTagSearchSuggestions()
  searchJumpIndex.value = 0
  if (searchMatchedIndices.value.length > 0) {
    scrollToSearchMatch(searchMatchedIndices.value[0])
  }
}

// 补全下拉的键盘导航；无高亮项时回车仍循环跳转匹配
const handleTagSearchKeydown = (event) => {
  if (tagSearchSuggestions.value.length > 0) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      tagSearchSuggestionIndex.value = (tagSearchSuggestionIndex.value + 1) % tagSearchSuggestions.value.length
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      tagSearchSuggestionIndex.value = tagSearchSuggestionIndex.value <= 0
        ? tagSearchSuggestions.value.length - 1
        : tagSearchSuggestionIndex.value - 1
      return
    }
    if (event.key === 'Enter' && tagSearchSuggestionIndex.value >= 0) {
      event.preventDefault()
      selectTagSearchSuggestion(tagSearchSuggestions.value[tagSearchSuggestionIndex.value])
      return
    }
  }
  if (event.key === 'Enter') {
    jumpToNextSearchMatch()
  }
}

// 滚动到指定匹配标签并闪烁提示
const scrollToSearchMatch = (index) => {
  const container = tokensContainerRef.value
  if (!container) return
  const el = container.querySelectorAll('.token-item-box')[index]
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // 闪烁动画（重复添加前先强制重排以重启动画）
  el.classList.remove('token-search-flash')
  void el.offsetWidth
  el.classList.add('token-search-flash')
  setTimeout(() => el.classList.remove('token-search-flash'), 1000)
}

// 回车跳转到下一个匹配
const jumpToNextSearchMatch = () => {
  const matches = searchMatchedIndices.value
  if (matches.length === 0) return
  searchJumpIndex.value = (searchJumpIndex.value + 1) % matches.length
  scrollToSearchMatch(matches[searchJumpIndex.value])
}

// 清空搜索
const clearTagSearch = () => {
  tagSearchQuery.value = ''
  searchJumpIndex.value = -1
  closeTagSearchSuggestions()
}

// ============ ESC 逐层关闭浮层 ============
// 优先级（由内到外）：确认框 → 自动补全面板 → 标签搜索补全下拉 → 框选菜单/高亮
// → 标签提示浮层 → 语言选择器 → Lora 堆面板。
// 在 capture 阶段拦截并阻止继续传播，确保 ESC 优先关闭弹窗/下拉，而不是触发其他 ESC 行为
const handleGlobalEscape = (event) => {
  if (event.key !== 'Escape') return

  if (showConfirmDialog.value) {
    event.preventDefault();
    event.stopPropagation();
    cancelConfirmDialog();
    return;
  }
  if (showAutocomplete.value) {
    event.preventDefault();
    event.stopPropagation();
    closeAutocomplete();
    return;
  }
  if (tagSearchSuggestions.value.length > 0) {
    // 先只关闭下拉、保留搜索词；再按一次 ESC 由搜索框自身的 @keydown.esc 清空搜索
    event.preventDefault();
    event.stopPropagation();
    closeTagSearchSuggestions();
    return;
  }
  if (showSelectionActions.value || selectedTokens.value.length > 0) {
    event.preventDefault();
    event.stopPropagation();
    clearSelectedTokens();
    return;
  }
  if (showTagTipsBox.value) {
    event.preventDefault();
    event.stopPropagation();
    showTagTipsBox.value = false;
    return;
  }
  if (showLanguageSelector.value) {
    event.preventDefault();
    event.stopPropagation();
    closeLanguageSelector();
    return;
  }
  if (loraOpen.value) {
    event.preventDefault();
    event.stopPropagation();
    closeLora();
    return;
  }
}

// ============ 自定义鼠标拖拽（替代 HTML5 drag&drop，规避放置权限/drop 不可靠等问题） ============
const mouseDragState = {
  pending: false,  // 已按下鼠标，等待移动距离超过阈值
  active: false,   // 拖拽进行中
  startIndex: null,
  startX: 0,
  startY: 0
};

// 在标签上按下鼠标：记录待判定的拖拽起点
const handleTokenMouseDown = (index, event) => {
  if (event.button !== 0) return;              // 只响应左键
  if (isBoxSelectMode.value) return;           // 框选模式下不拖拽
  if (tokens.value[index]?.isEditing) return;  // 编辑中的标签不可拖
  mouseDragState.pending = true;
  mouseDragState.active = false;
  mouseDragState.startIndex = index;
  mouseDragState.startX = event.clientX;
  mouseDragState.startY = event.clientY;
  // 记录抓取点相对标签的偏移，让虚影保持按下时的相对位置
  const startEl = event.target.closest('.token-item-box');
  if (startEl) {
    const r = startEl.getBoundingClientRect();
    mouseDragState.offsetX = event.clientX - r.left;
    mouseDragState.offsetY = event.clientY - r.top;
  } else {
    mouseDragState.offsetX = 0;
    mouseDragState.offsetY = 0;
  }
  hideDropIndicator();
};

// 更新插入点指示线（按鼠标坐标查找最近标签判定插入点，容器底部空白区域插到最后）
const updateDragIndicatorAtPoint = (clientX, clientY) => {
  const found = findInsertTargetFromPoint(clientX, clientY);
  if (!found) {
    hideDropIndicator();
    return;
  }
  const container = tokensContainerRef.value;
  const idx = Array.prototype.indexOf.call(
    container.querySelectorAll('.token-item-box'), found.el);
  if (idx < 0 || idx >= tokens.value.length) {
    hideDropIndicator();
    return;
  }
  pendingDropTarget = { index: idx, isAfter: found.isAfter };

  // 悬停点正对正在被拖动的标签：不产生插入效果
  const targetToken = tokens.value[idx];
  if (dragTempState.draggedItems.includes(targetToken)) {
    hideDropIndicator();
    return;
  }
  updateDropIndicator(found.el, found.isAfter);
};

// 拖拽虚影：跟随鼠标的半透明标签克隆
let dragGhostEl = null;
const dragGhostSources = [];

const removeDragGhost = () => {
  if (dragGhostEl) {
    dragGhostEl.remove();
    dragGhostEl = null;
  }
  dragGhostSources.forEach(el => el.classList.remove('weilin-dragging-src'));
  dragGhostSources.length = 0;
};

const createDragGhost = () => {
  removeDragGhost();
  const container = tokensContainerRef.value;
  if (!container) return;
  const boxes = container.querySelectorAll('.token-item-box');
  const indices = draggedTokens.value.length > 0 ? draggedTokens.value : [mouseDragState.startIndex];
  const ghost = document.createElement('div');
  ghost.className = 'weilin-drag-ghost';
  indices.forEach(i => {
    const src = boxes[i];
    if (!src) return;
    // 原标签虚化，克隆体作为虚影
    src.classList.add('weilin-dragging-src');
    dragGhostSources.push(src);
    // 不能用 cloneNode：克隆体挂在 body 上拿不到 scoped 样式和主题 CSS 变量
    // （背景/文字色全是 var(--weilin-*)，在 body 上解析为空 → 只剩裸文本）。
    // 改为从原标签读取已解析的实际样式，以内联样式自绘虚影
    const cs = getComputedStyle(src);
    const token = tokens.value[i];
    const chip = document.createElement('div');
    // 虚影展示与标签一致：原文 + 译文（译文用同色降透明度——虚影挂在 body 上，
    // 取不到主题 CSS 变量，无法直接使用次要文字色）
    const mainText = !token || token.text === '\n' ? '↵' : (token.text === '\t' ? '→' : token.text);
    const textEl = document.createElement('span');
    textEl.textContent = mainText;
    textEl.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px';
    chip.appendChild(textEl);
    const translateText = token && token.translate ? String(token.translate).trim() : '';
    if (translateText) {
      const trEl = document.createElement('span');
      trEl.textContent = translateText;
      // 译文另起一行、居中（与原文同列居中）
      trEl.style.cssText = 'align-self:stretch;text-align:center;font-weight:400;opacity:0.65;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px';
      chip.appendChild(trEl);
    }
    chip.style.cssText = [
      'box-sizing:border-box',
      'display:inline-flex',
      'flex-direction:column',
      'align-items:center',
      'text-align:center',
      'padding:3px 8px',
      'border-radius:6px',
      'font-size:' + cs.fontSize,
      'line-height:' + cs.lineHeight,
      'font-family:' + cs.fontFamily,
      'font-weight:' + cs.fontWeight,
      'color:' + cs.color,
      'background-color:' + cs.backgroundColor,
      'border:1px solid rgba(128,128,128,0.35)',
      'white-space:nowrap',
      'max-width:300px',
      'overflow:hidden'
    ].join(';');
    ghost.appendChild(chip);
  });
  if (!ghost.children.length) return;
  document.body.appendChild(ghost);
  dragGhostEl = ghost;
};

// 文档级 mousemove：移动超过阈值正式进入拖拽，实时更新插入指示线与虚影位置
const handleDocumentMouseMove = (event) => {
  if (!mouseDragState.pending && !mouseDragState.active) return;
  if (!mouseDragState.active) {
    const dx = event.clientX - mouseDragState.startX;
    const dy = event.clientY - mouseDragState.startY;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    // 正式开始拖拽
    mouseDragState.active = true;
    initializeDragState(mouseDragState.startIndex, true);
    createDragGhost();
    // 拖拽期间强制统一为抓取光标，避免经过不同元素时指针样式变来变去
    document.body.classList.add('weilin-dragging-cursor');
    // 收起拖拽起点的悬浮控制栏与提示框
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value);
      hideTimeout.value = null;
    }
    isOverControls.value = false;
    activeControls.value = null;
    showTagTipsBox.value = false;
  }
  lastDragPoint = { x: event.clientX, y: event.clientY };
  if (isDragging.value && dragTempState) {
    updateDragIndicatorAtPoint(event.clientX, event.clientY);
  }
  // 虚影跟随鼠标（保持按下时的抓取偏移）
  if (dragGhostEl) {
    dragGhostEl.style.left = (event.clientX - mouseDragState.offsetX) + 'px';
    dragGhostEl.style.top = (event.clientY - mouseDragState.offsetY) + 'px';
  }
};

// 结束拖拽：落点在词组区域内时按指示线位置执行移动，否则取消
const finishDragAtPoint = (x, y) => {
  const container = tokensContainerRef.value;
  let inside = false;
  if (container && x != null && y != null) {
    const r = container.getBoundingClientRect();
    inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  if (inside && pendingDropTarget &&
    pendingDropTarget.index >= 0 && pendingDropTarget.index < tokens.value.length) {
    performDragUpdate(pendingDropTarget.index, pendingDropTarget.isAfter);
  }
  // 重置拖拽相关状态，但保留选中状态(selectedTokens)
  removeDragGhost();
  document.body.classList.remove('weilin-dragging-cursor');
  lastDragPoint = null;
  isDragging.value = false;
  dragStartIndex.value = null;
  draggedTokens.value = [];
  dragTempState = null;
  hideDropIndicator();
};

// 文档级 mouseup：松开鼠标即结束拖拽
const handleDocumentMouseUp = () => {
  if (mouseDragState.active) {
    const p = lastDragPoint;
    finishDragAtPoint(p ? p.x : null, p ? p.y : null);
  }
  mouseDragState.pending = false;
  mouseDragState.active = false;
};

// 注册文档级鼠标监听（自定义拖拽不依赖浏览器的放置权限机制，任何环境下都可靠）
// 注册文档级鼠标监听（自定义拖拽不依赖浏览器的放置权限机制，任何环境下都可靠）
document.addEventListener('mousemove', handleDocumentMouseMove);
document.addEventListener('mouseup', handleDocumentMouseUp);

// 更新插入指示线位置（相对 tokens-container 的 padding box，居中显示在标签之间的空隙里）
const updateDropIndicator = (targetEl, isAfter) => {
  const container = tokensContainerRef.value;
  if (!container) return;
  const rect = targetEl.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const cs = getComputedStyle(container);
  // 读取标签之间的实际间距，指示线中心落在空隙正中，避免压在标签上
  const gap = parseFloat(cs.columnGap) || 8;
  // absolute 定位的包含块是容器的 padding box，而 getBoundingClientRect 返回的是 border box，
  // 两者相差边框宽度，需要补偿，否则指示线整体偏向右侧
  const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
  const borderTop = parseFloat(cs.borderTopWidth) || 0;
  const INDICATOR_WIDTH = 4; // 与 .drop-indicator 的 width 保持一致
  const centerX = isAfter ? rect.right + gap / 2 : rect.left - gap / 2;
  dropIndicator.value = {
    show: true,
    x: centerX - cRect.left - borderLeft - INDICATOR_WIDTH / 2,
    y: rect.top - cRect.top - borderTop - 4,
    height: rect.height + 8
  };
};

// 根据鼠标坐标查找最近的插入目标（用于悬停在标签间空隙或空白区域时）
const findInsertTargetFromPoint = (clientX, clientY) => {
  const container = tokensContainerRef.value;
  if (!container) return null;
  const boxes = container.querySelectorAll('.token-item-box');
  if (boxes.length === 0) return null;
  let best = null;
  boxes.forEach(el => {
    const r = el.getBoundingClientRect();
    // 只考虑与鼠标垂直方向重叠的行
    if (clientY < r.top - 4 || clientY > r.bottom + 4) return;
    let dist;
    let isAfter;
    if (clientX < r.left) {
      dist = r.left - clientX;
      isAfter = false;
    } else if (clientX > r.right) {
      dist = clientX - r.right;
      isAfter = true;
    } else {
      dist = 0;
      isAfter = clientX > r.left + r.width / 2;
    }
    if (!best || dist < best.dist) best = { el, dist, isAfter };
  });
  // 鼠标在所有行之外（如容器底部空白）：插到最后一个标签之后
  if (!best) {
    return { el: boxes[boxes.length - 1], isAfter: true };
  }
  return best;
};

// 执行拖拽更新：把被拖动元素移动到目标插入点（始终基于当前数组计算，避免坐标错位）
const performDragUpdate = (targetIndex, isAfter = false) => {
  if (!dragTempState) return;

  const draggedItems = dragTempState.draggedItems;

  // 定位被拖动元素在当前数组中的索引（对象身份匹配）
  const draggedIdx = [];
  tokens.value.forEach((t, i) => {
    if (draggedItems.includes(t)) draggedIdx.push(i);
  });
  if (draggedIdx.length === 0) return;

  // 目标是被拖动的元素本身，不做处理
  const targetToken = tokens.value[targetIndex];
  if (targetToken && draggedItems.includes(targetToken)) return;

  // 计算插入间隙：目标右半区 = 插入到目标之后
  let gap = isAfter ? targetIndex + 1 : targetIndex;

  // 移除被拖动元素，并按被移除元素的位置修正插入间隙
  const remaining = tokens.value.filter(t => !draggedItems.includes(t));
  draggedIdx.forEach(i => {
    if (i < gap) gap--;
  });
  gap = Math.max(0, Math.min(gap, remaining.length));

  // 构建新数组
  const newTokens = [...remaining];
  draggedItems.forEach((item, i) => {
    newTokens.splice(gap + i, 0, item);
  });

  // 位置未变化时不触发更新，避免无意义的重渲染
  const unchanged = newTokens.length === tokens.value.length &&
    newTokens.every((t, i) => t === tokens.value[i]);
  if (unchanged) return;

  // 更新tokens数组和输入文本
  tokens.value = newTokens;
  updateInputText();

  // 批量拖拽时，按对象身份重新映射选中索引
  if (dragTempState.isBatch) {
    selectedTokens.value = tokens.value.reduce((acc, t, i) => {
      if (draggedItems.includes(t)) acc.push(i);
      return acc;
    }, []);

    // 在DOM更新后应用选中样式
    nextTick(() => applySelectedStyle());
  }
};

const updateInputText = () => {
  // 更新输入文本，保持原有格式，但排除隐藏的tokens
  inputText.value = tokens.value.length > 0
    ? tokens.value.reduce((acc, token, index) => {
      // 如果token是隐藏的，不添加到输入文本中
      if (token.isHidden) {
        return acc;
      }

      // 如果是换行符，不加逗号
      if (token.text === '\n') {
        // 查找前一个非隐藏token
        const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
        const prevToken = prevNonHiddenIndex !== -1 ? tokens.value[prevNonHiddenIndex] : null;

        // 直接返回换行符，不添加额外的逗号
        // 因为前一个token在处理时已经根据shouldAddComma添加了逗号
        return acc + token.text;
      }

      // 第一个非隐藏token不加逗号前缀
      if (acc === '') {
        // 查找下一个非隐藏token
        let nextNonHiddenIndex = index + 1;
        while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
          nextNonHiddenIndex++;
        }

        // 判断是否是最后一个非隐藏token或者下一个是换行符
        const isLastToken = nextNonHiddenIndex >= tokens.value.length;
        const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;
        const shouldAddComma = isLastToken || (nextToken && nextToken.text === '\n');

        return token.text + (shouldAddComma ? ',' : '');
      }

      // 查找下一个非隐藏token
      let nextNonHiddenIndex = index + 1;
      while (nextNonHiddenIndex < tokens.value.length && tokens.value[nextNonHiddenIndex]?.isHidden) {
        nextNonHiddenIndex++;
      }

      // 判断是否是最后一个非隐藏token
      const isLastToken = nextNonHiddenIndex >= tokens.value.length;
      const nextToken = nextNonHiddenIndex < tokens.value.length ? tokens.value[nextNonHiddenIndex] : null;

      // 如果是换行符前或者最后一个token，则添加逗号
      const shouldAddComma = (nextToken && nextToken.text === '\n') || isLastToken;

      // 前一个token是换行符，不加逗号前缀
      const prevNonHiddenIndex = findPrevNonHiddenIndex(index);
      if (prevNonHiddenIndex !== -1 && tokens.value[prevNonHiddenIndex].text === '\n') {
        return acc + token.text + (shouldAddComma ? ',' : '');
      }

      // 其他情况加逗号和空格前缀
      return acc + ', ' + token.text + (shouldAddComma ? ',' : '');
    }, '') : '';

  postMessageToWindowsPrompt()
};

// AI对话（再次点击关闭）
const openAIChat = () => {
  window.parent.postMessage({ type: 'weilin_prompt_ui_openAiWindow', data: { toggle: true } }, '*')
}

const openGitHub = () => {
  window.open('https://github.com/weilin9999/WeiLin-Comfyui-Tools', '_blank')
}

const shareCloudData = () => {
  window.parent.postMessage({ type: 'weilin_prompt_ui_open_cloud_window', data: { toggle: true } }, '*')
}

const openDanbooruManager = () => {
  window.parent.postMessage({ type: 'weilin_prompt_ui_open_danbooru_manager_window', data: { toggle: true } }, '*')
}

const openSponsor = () => {
  window.open('https://afdian.com/a/weilin9999', '_blank')
}

// 添加一个辅助函数来查找前一个非隐藏的token索引
const findPrevNonHiddenIndex = (currentIndex) => {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!tokens.value[i].isHidden) {
      return i;
    }
  }
  return -1;
};

// 添加toggleHidden方法
const toggleHidden = (index, event) => {
  // 双击编辑输入框时不触发启用/禁用（事件冒泡到 token-item-box 的 dblclick）
  const t = event && event.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
    return
  }
  if (index >= 0 && index < tokens.value.length) {
    // 不允许隐藏换行符
    if (tokens.value[index].text === '\n' || tokens.value[index].text === '\t') {
      return;
    }

    // 切换隐藏状态
    tokens.value[index].isHidden = !tokens.value[index].isHidden;

    // 添加/移除隐藏提示
    if (tokens.value[index].isHidden) {
      tokens.value[index].hiddenHint = t('promptBox.hiddenHint'); // 使用国际化提示
    } else {
      tokens.value[index].hiddenHint = '';
    }

    // 更新输入文本，排除隐藏的tokens
    updateInputText();
  }
};

const openBilibili = () => {
  window.open('https://www.bilibili.com/list/288025756/?sid=4690314&spm_id_from=333.1387.0.0&oid=114342431298474&bvid=BV1txdfYxE7X', '_blank');
};

// 一键随机Tag方法
const oneClickRandomTag = async () => {
  if (props.promptManager == "prompt_global") {
    try {
      await randomTagApi.goRandomTemplate().then((res) => {
        if (res.code === 200) {
          // console.log(res.random_tags)
          inputText.value = res.random_tags
          nextTick(() => {
            // 触发输入处理
            processInput();
          })
        } else {
          message({ type: "warn", str: res.info });
        }
      }).catch((err) => {
        console.error(err);
        message({ type: "warn", str: 'message.networkError' });
      });
    } catch (error) {
      message({ type: "warn", str: 'message.networkError' });
      console.error('Error loading random tag settings:', error)
    }
  } else {
    window.postMessage({
      type: 'weilin_prompt_ui_prompt_inner_get_node_tag_template_id_gorandom'
    }, '*')
  }

};

const onClickLocalTemplateRandomTag = async (name) => {
  try {
    await randomTagApi.goRandomTemplatePath(name).then((res) => {
      if (res.code === 200) {
        // console.log(res.random_tags)
        inputText.value = res.random_tags
        nextTick(() => {
          // 触发输入处理
          processInput();
        })
      } else {
        message({ type: "warn", str: res.info });
      }
    }).catch((err) => {
      console.error(err);
      message({ type: "warn", str: 'message.networkError' });
    });
  } catch (error) {
    message({ type: "warn", str: 'message.networkError' });
    console.error('Error loading random tag settings:', error)
  }
}

const favourItemRef = ref(null);
const openFavourTag = (tokenInfo) => {
  if (favourItemRef.value) {
    favourItemRef.value.open(tokenInfo.text, tokenInfo.translate)
  }
}

/**
 * 从短码反向解析出原始路径
 * 
 * @param {string} shortcode - 短码
 * @returns {string} - 原始文件路径
 */
const shortcodeToPath = (shortcode) => {
  try {
    // 还原 Base64 编码中被替换的字符
    let base64Str = shortcode.replace(/-/g, '+').replace(/_/g, '/');

    // 添加回可能被移除的填充字符
    const padding = 4 - (base64Str.length % 4);
    if (padding < 4) {
      base64Str += '='.repeat(padding);
    }

    // 解码 Base64
    const binaryStr = atob(base64Str);

    // 将二进制字符串转换为 Uint8Array
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // 解压缩
    const decompressed = pako.inflate(bytes);

    // 将 Uint8Array 转换为字符串
    const decoder = new TextDecoder('utf-8');
    const path = decoder.decode(decompressed);

    return path;
  } catch (error) {
    console.error('解析短码时出错:', error);
    return '';
  }
};

// 打开随机Tag设置对话框
const openRandomTagSettings = () => {
  randomSettingItem.value.open(props.promptManager)
};

const clearAllPrompt = () => {
  inputText.value = '';
  tokens.value = [];
  translateText.value = '';
  selectedLoras.value = [];
  lastInputValue.value = '';
  // 如有其它需要清空的内容可一并处理
  updateInputText();
};

// 一键清空禁用标签方法
const clearDisabledTags = () => {
  // 过滤掉隐藏的标签，保留其他标签
  const filteredTokens = tokens.value.filter(token => !token.isHidden);

  // 更新 tokens 数组
  tokens.value = filteredTokens;

  // 重新构建输入文本
  updateInputText();

  // 显示成功提示
  message({ type: "success", str: t('promptBox.clearDisabledSuccess') || '已清空所有禁用标签' });
};

defineExpose({
  setPromptText
})
</script>

<style scoped>
@import "./prompt_index.css";
</style>

<style>
/* 全局样式（不能用 scoped）：拖拽虚影挂载在 document.body 上，
   组件外的元素拿不到 scoped 样式，position:fixed 等必须写在这里才能生效 */
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

/* 74.93：Lora 管理模块展开（prompt-box 带 weilin-lora-embed-active）时，window-content 的
   16px padding 会把内部 main-content 的滚动条往里推（右 16px、上下各 16px），与收起态
   （滚动在 window-content 自身、滚动条贴窗口边、纵贯全窗口高）位置不一致。
   此处把四边 padding 全部归零，main-content 右缘/上下缘即落到窗口边，滚动条与收起态同位。
   那 16px 间隙改由 main-content 自身 padding 提供（padding 不会缩短滚动条轨道，故仍对齐）。
   LoraStack 自带 inline padding-right:16px，不依赖此 padding，无副作用。 */
.weilin_prompt_ui_window-content:has(.weilin-lora-embed-active) {
    padding: 0;
}
</style>