<template>
  <div class="nav-github-wrapper">
    <span class="nav-divider"></span>
    <a class="nav-github" href="https://github.com/liukun2634/dev-interview-guide" target="_blank" rel="noopener">
      <svg class="nav-github-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
      </svg>
      <svg class="nav-github-star" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
      </svg>
      <span class="nav-github-text">Star</span>
    </a>
  </div>
</template>

<style scoped>
.nav-github-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
  flex-shrink: 0;
  order: 30;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: var(--ghd-borderColor-default);
  flex-shrink: 0;
}

.nav-github {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ghd-fgColor-default);
  text-decoration: none;
  background: var(--ghd-bgColor-muted);
  border: 1px solid var(--ghd-borderColor-default);
  border-radius: var(--ghd-radius);
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  line-height: 20px;
  flex-shrink: 0;
}

.nav-github:hover {
  background: var(--ghd-bgColor-inset);
  border-color: var(--ghd-borderColor-emphasis);
}

.nav-github-icon {
  flex-shrink: 0;
  color: var(--ghd-fgColor-default);
}

.nav-github-star {
  flex-shrink: 0;
  color: var(--ghd-attention-fg);
}

.nav-github-text {
  color: var(--ghd-fgColor-default);
}

@media (max-width: 768px) {
  .nav-github-wrapper {
    display: none;
  }
}
</style>
