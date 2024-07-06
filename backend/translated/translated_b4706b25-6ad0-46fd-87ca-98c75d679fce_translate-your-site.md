<hr /> 
<h2>sidebar_position: 2</h2> 
<h1>사이트 번역하기</h1> 
<p><code>docs/intro.md</code> 파일을 프랑스어로 번역해봅시다.</p> 
<h2>i18n 구성</h2> 
<p><code>docusaurus.config.js</code> 파일을 수정하여 <code>fr</code> 로케일을 지원하도록 추가하세요:</p> 
<p><code>js title="docusaurus.config.js" 
export default { 
  i18n: { 
    defaultLocale: 'en', 
    locales: ['en', 'fr'], 
  }, 
};</code></p> 
<h2>문서 번역하기</h2> 
<p><code>docs/intro.md</code> 파일을 <code>i18n/fr</code> 디렉터리로 복사하세요.</p>폴더:</p>
<p>```bash
mkdir -p i18n/fr/docusaurus-plugin-content-docs/current/</p>
<p>cp docs/intro.md i18n/fr/docusaurus-plugin-content-docs/current/intro.md
```</p>
<p><code>i18n/fr/docusaurus-plugin-content-docs/current/intro.md</code> 파일을 프랑스어로 번역합니다.</p>
<h2>로컬라이즈된 사이트 시작하기</h2>
<p>프랑스어 로케일로 사이트를 시작합니다:</p>
<p><code>bash
npm run start -- --locale fr</code></p>
<p>로컬라이즈된 사이트는 다음에서 접근할 수 있습니다: <ahref="http://localhost:3000/fr/">http://localhost:3000/fr/</a> 그리고 <code>Getting Started</code> 페이지가 번역되었습니다.</p>
<p>:::주의</p>
<p>개발 중에는 한 번에 하나의 로케일만 사용할 수 있습니다.</p>
<p>:::</p>
<h2>로케일 드롭다운 추가</h2>
<p>언어 간 원활한 탐색을 위해 로케일 드롭다운을 추가하세요.</p>
<p><code>docusaurus.config.js</code> 파일을 수정하세요:</p>
<p><code>js title="docusaurus.config.js"
export default {
  themeConfig: {
    navbar: {
      items: [// highlight-start 
         { 
           type: 'localeDropdown', 
         }, 
         // highlight-end 
       ], 
     }, 
   }, 
 };</code></p> 
 <p>이제 로케일 드롭다운이 네비게이션 바에 나타납니다:</p> 
 <p><img alt="Locale Dropdown" src="./img/localeDropdown.png" /></p> 
 <h2>로컬라이즈된 사이트 빌드하기</h2> 
 <p>특정 로케일을 위해 사이트를 빌드합니다:</p> 
 <p><code>bash 
 npm run build -- --locale fr</code></p> 
 <p>또는 한 번에 모든 로케일을 포함하여 사이트를 빌드합니다:</p> 
 <p><code>bash 
 npm run빌드</code></p>