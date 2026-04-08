(function () {
  // 전역 기본 옵션 (create({...})로 덮어쓸 수 있음)
  const DEFAULT_OPTIONS = {
    selector: "[data-scroll], [data-scroll-effect]", // 스크롤 효과를 적용할 대상 선택자
    root: null, // 관찰 기준 컨테이너(null이면 브라우저 뷰포트 기준)
    rootMargin: "0px 0px -10% 0px", // 관찰 영역 여백(하단 -10%로 진입 시점을 조금 앞당김)
    threshold: 0.15, // 요소가 보이는 비율이 이 값 이상일 때 진입으로 판단
    once: false, // true면 1회만 실행, false면 이탈/재진입 시 반복 실행
    resetOnLeave: "both", // 이탈 시 효과 해제 방향: both | up | down | none
    debug: false, // 디버깅 로그 사용 여부(현재 확장용 옵션)
  };

  // 내장 효과 프리셋
  const baseEffects = {
    "fade": {
      initial: "se-fade",
      active: "se-fade-in",
    },
    "slide-left": {
      initial: "se-slide-left",
      active: "se-slide-in",
    },
    "slide-right": {
      initial: "se-slide-right",
      active: "se-slide-in",
    },
    "zoom-in": {
      initial: "se-zoom-in",
      active: "se-zoom-in-active",
    },
    // 화려한 커스텀 프리셋 (data-scroll-effect로 바로 사용)
    "pop": {
      initial: "fx-pop",
      active: "fx-pop-in",
    },
    "tilt-left": {
      initial: "fx-tilt-left",
      active: "fx-tilt-left-in",
    },
    "tilt-right": {
      initial: "fx-tilt-right",
      active: "fx-tilt-right-in",
    },
    "spin-up": {
      initial: "fx-spin-up",
      active: "fx-spin-up-in",
    },
    "glass-rise": {
      initial: "fx-glass-rise",
      active: "fx-glass-rise-in",
    },
    "punch": {
      initial: "fx-punch",
      active: "fx-punch-in",
    },
  };

  // 스크롤 이벤트 컨트롤러
  class ScrollEvents {
    constructor(options = {}) {
      // 기본 옵션 + 사용자 옵션 병합
      this.options = { ...DEFAULT_OPTIONS, ...options };
      // 내장 효과 + 외부 등록 효과
      this.effects = { ...baseEffects };
      // 관찰 대상 캐시
      this.items = [];
      this.observer = null;
      this.isInitialized = false;
      // observe 시작 타이밍 제어용 raf id
      this.observeRafId = null;
      // 요소 이탈 시 스크롤 방향(up/down) 판단용
      this.lastScrollY = window.scrollY || window.pageYOffset || 0;
      this._onIntersect = this._onIntersect.bind(this);
    }

    // 외부에서 커스텀 효과 클래스 쌍 등록
    registerEffect(name, config) {
      if (!name || !config || !config.initial || !config.active) {
        throw new Error("[ScrollEvents] registerEffect(name, {initial, active}) is required.");
      }
      this.effects[name] = config;
      return this;
    }

    // IntersectionObserver 초기화 후 관찰 시작
    init() {
      if (this.isInitialized) return this;

      // IntersectionObserver 미지원 환경 폴백
      if (!("IntersectionObserver" in window)) {
        this._fallbackShowAll();
        return this;
      }

      this.observer = new IntersectionObserver(this._onIntersect, {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      });

      this.refresh();
      this.isInitialized = true;
      return this;
    }

    // selector 대상 DOM 재스캔 후 다시 observe
    refresh() {
      const nodes = Array.from(document.querySelectorAll(this.options.selector));
      this.items = nodes.map((el) => this._prepareItem(el));

      if (!this.observer) return this;

      // 초기 스타일이 먼저 페인트된 뒤 observe하도록 1프레임 지연
      if (this.observeRafId) cancelAnimationFrame(this.observeRafId);
      this.observeRafId = requestAnimationFrame(() => {
        this.items.forEach((item) => {
          this.observer.observe(item.el);
        });
        this.observeRafId = null;
      });

      return this;
    }

    // 옵저버 해제 및 적용된 상태/클래스 정리
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this.observeRafId) {
        cancelAnimationFrame(this.observeRafId);
        this.observeRafId = null;
      }

      this.items.forEach((item) => {
        if (item.enterRafId) cancelAnimationFrame(item.enterRafId);
        item.el.classList.remove("se-ready", item.effect.initial, item.effect.active);
        item.el.removeAttribute("data-scroll-in");
      });

      this.items = [];
      this.isInitialized = false;
    }

    // DOM 요소를 내부 아이템 모델로 변환
    _prepareItem(el) {
      const effectName = this._resolveEffectName(el);
      const effect = this.effects[effectName] || this.effects.fade;
      const delay = Number(el.dataset.scrollDelay || 0);
      const duration = Number(el.dataset.scrollDuration || 600);
      const once = this._resolveOnce(el);
      const reset = this._resolveReset(el);

      el.style.setProperty("--se-delay", `${delay}ms`);
      el.style.setProperty("--se-duration", `${duration}ms`);
      el.classList.add("se-ready", effect.initial);

      return { el, effect, once, reset };
    }

    // data 속성에서 효과명 결정
    _resolveEffectName(el) {
      if (el.dataset.scrollEffect) return el.dataset.scrollEffect;
      const raw = (el.dataset.scroll || "").trim();
      if (!raw || raw === "true") return "fade";
      return raw;
    }

    // 1회 실행/반복 실행 여부 결정
    _resolveOnce(el) {
      const elementOnce = el.dataset.scrollOnce;
      if (elementOnce == null) return this.options.once;
      return elementOnce !== "false";
    }

    // 뷰포트 이탈 시 리셋 정책 결정
    _resolveReset(el) {
      const mode = (el.dataset.scrollReset || this.options.resetOnLeave || "both").trim().toLowerCase();
      if (mode === "up" || mode === "down" || mode === "none") return mode;
      return "both";
    }

    // IntersectionObserver 콜백: 진입/이탈 처리
    _onIntersect(entries) {
      // 방향 기반 리셋 처리를 위한 현재 스크롤 방향 계산
      const currentY = window.scrollY || window.pageYOffset || 0;
      const direction = currentY >= this.lastScrollY ? "down" : "up";
      this.lastScrollY = currentY;

      entries.forEach((entry) => {
        const item = this.items.find((x) => x.el === entry.target);
        if (!item) return;

        if (entry.isIntersecting) {
          this._enter(item);
          if (item.once && this.observer) this.observer.unobserve(item.el);
        } else if (!item.once && this._shouldReset(item, direction)) {
          this._leave(item);
        }
      });
    }

    // 현재 이탈 이벤트에서 리셋할지 여부 판단
    _shouldReset(item, direction) {
      if (item.reset === "none") return false;
      if (item.reset === "both") return true;
      return item.reset === direction;
    }

    // 뷰포트 진입 시 활성 효과 적용
    _enter(item) {
      // 같은 프레임 즉시 적용 시 모바일에서 트랜지션이 생략되는 케이스 방지
      if (item.enterRafId) cancelAnimationFrame(item.enterRafId);
      item.enterRafId = requestAnimationFrame(() => {
        item.el.classList.add(item.effect.active);
        item.el.setAttribute("data-scroll-in", "true");
        item.enterRafId = null;
      });
    }

    // 뷰포트 이탈 시 활성 효과 해제(반복 실행용)
    _leave(item) {
      if (item.enterRafId) {
        cancelAnimationFrame(item.enterRafId);
        item.enterRafId = null;
      }
      item.el.classList.remove(item.effect.active);
      item.el.setAttribute("data-scroll-in", "false");
    }

    // 최소 폴백: 대상 요소를 즉시 노출
    _fallbackShowAll() {
      const nodes = Array.from(document.querySelectorAll(this.options.selector));
      nodes.forEach((el) => {
        el.classList.add("se-ready", "se-fade-in");
        el.setAttribute("data-scroll-in", "true");
      });
    }
  }

  // 외부 사용용 팩토리 함수: window.ScrollEvents.create(...)
  function createScrollEvents(options = {}) {
    return new ScrollEvents(options);
  }

  // 전역 API 노출 (CDN/script 태그 환경)
  window.ScrollEvents = {
    create: createScrollEvents,
    ScrollEvents,
  };
})();
