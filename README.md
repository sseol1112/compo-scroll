# ScrollEvents (ES6 / Vanilla JS)

외부 프로젝트에서 바로 붙여 쓸 수 있는 스크롤 인터랙션 컴포넌트입니다.

## 1) 외부 프로젝트에 파일 배치

필수 파일 2개만 복사해서 정적 리소스로 배포합니다.

- `scroll-events.js`
- `scroll-events.css`

예시:

- 사내 CDN: `/assets/scroll-events/scroll-events.js`
- 공개 CDN: `https://cdn.example.com/scroll-events/scroll-events.js`

## 2) HTML에 리소스 연결

```html
<link rel="stylesheet" href="https://cdn.example.com/scroll-events/scroll-events.css" />
<script src="https://cdn.example.com/scroll-events/scroll-events.js"></script>
```

## 3) 마크업에 data 속성 지정

```html
<section data-scroll="true">기본 fade</section>
<section data-scroll="slide-left">왼쪽에서 진입</section>
<section data-scroll="slide-right">오른쪽에서 진입</section>
<section data-scroll="zoom-in">줌 인</section>
```

## 4) JS 초기화

```html
<script>
  const scroll = window.ScrollEvents.create({
    once: false,
    resetOnLeave: "both",
    threshold: 0.15,
    rootMargin: "0px 0px -10% 0px",
  });

  scroll.init();
</script>
```

## 5) 외부 호출 API

- `scroll.init()` 초기화 및 관찰 시작
- `scroll.refresh()` 동적으로 추가된 DOM 재스캔
- `scroll.destroy()` 옵저버 해제 및 상태 정리
- `scroll.registerEffect(name, { initial, active })` 커스텀 효과 등록

## 6) data 속성 가이드

- `data-scroll="true"`: 기본 `fade`
- `data-scroll="fade|slide-left|slide-right|zoom-in"`: 효과 타입
- `data-scroll-effect="effectName"`: 사용자 정의 효과명 (`data-scroll` 없이 사용 가능)
- `data-scroll-delay="150"`: 지연 시간(ms)
- `data-scroll-duration="800"`: 지속 시간(ms)
- `data-scroll-once="true|false"`: 1회 실행 여부
- `data-scroll-reset="both|up|down|none"`: 뷰포트 이탈 시 효과 해제 조건

## 7) 커스텀 효과 등록 예시

```js
scroll.registerEffect("pop", {
  initial: "custom-pop",
  active: "custom-pop-in",
});
```

```css
.custom-pop {
  opacity: 0;
  transform: translateY(32px) scale(0.95);
}

.custom-pop-in {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

## 8) 동적 렌더링 환경에서 사용

AJAX/컴포넌트 렌더링 이후 요소가 추가되면 아래를 호출합니다.

```js
scroll.refresh();
```


## Quick Start (Wiki)

팀 위키에 바로 복붙해서 쓰는 30초 적용 가이드입니다.

### 1) 리소스 연결

```html
<link rel="stylesheet" href="https://cdn.example.com/scroll-events/scroll-events.css" />
<script src="https://cdn.example.com/scroll-events/scroll-events.js"></script>
```

### 2) 마크업에 data-scroll 추가

```html
<section data-scroll="true">기본 fade</section>
<section data-scroll="slide-left">왼쪽 진입</section>
<section data-scroll="slide-right">오른쪽 진입</section>
<section data-scroll="zoom-in">줌 인</section>
```

### 3) 초기화

```html
<script>
  const scroll = window.ScrollEvents.create({
    once: false,
    resetOnLeave: "both", // both | up | down | none
    threshold: 0.15,
  });
  scroll.init();
</script>
```

### 4) 자주 쓰는 옵션

- `data-scroll-delay="150"`: 시작 지연(ms)
- `data-scroll-duration="800"`: 애니메이션 시간(ms)
- `data-scroll-once="true|false"`: 1회/반복 실행
- `data-scroll-reset="both|up|down|none"`: 이탈 시 효과 해제 조건

### 5) 동적 렌더링 시

```js
scroll.refresh();
```