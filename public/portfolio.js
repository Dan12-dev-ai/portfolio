/**
 * portfolio.js — shared client runtime for every served page.
 *
 * Loaded with `defer` on all pages (see src/lib/chrome.ts). Responsibilities:
 *   1. Mobile navigation drawer (open/close, escape, scroll lock, focus return)
 *   2. Header elevation + reading-progress bar
 *   3. Back-to-top button and smooth in-page anchor scrolling
 *   4. Reveal-on-scroll for `.pd-reveal` elements
 *   5. Live status telemetry from `GET /api/health`
 *   6. Click tracking for platform links (`GET /api/connect/<platform>`)
 *   7. Copy-to-clipboard helpers and a small toast system
 *
 * Exposes `window.Portfolio` so page-specific scripts (the contact form) can
 * reuse the toast + fetch helpers.
 */
(function () {
  'use strict'

  var doc = document

  // Guard against a second execution in the same document (the App Router can
  // re-inject a loaded script on a client-side navigation). The listeners
  // below are registered once and re-query their targets on every event, so
  // one run keeps working even when the chrome DOM is rebuilt.
  if (window.__pdInit) return
  window.__pdInit = true

  /* ------------------------------------------------------------- toasts */

  function host() {
    var node = doc.querySelector('[data-pd-toasts]')
    if (!node) {
      node = doc.createElement('div')
      node.className = 'pd-toasts'
      node.setAttribute('data-pd-toasts', '')
      doc.body.appendChild(node)
    }
    return node
  }

  function toast(message, options) {
    var opts = options || {}
    var kind = opts.type || 'info'
    var el = doc.createElement('div')
    el.className = 'pd-toast pd-toast--' + kind
    el.setAttribute('role', 'status')

    var wrap = doc.createElement('div')
    if (opts.title) {
      var title = doc.createElement('strong')
      title.className = 'pd-toast__title'
      title.textContent = opts.title
      wrap.appendChild(title)
    }
    var text = doc.createElement('span')
    text.className = 'pd-toast__body'
    text.textContent = message
    wrap.appendChild(text)
    el.appendChild(wrap)
    host().appendChild(el)

    var life = typeof opts.duration === 'number' ? opts.duration : 4200
    window.setTimeout(function () {
      el.classList.add('is-leaving')
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el)
      }, 260)
    }, life)

    el.addEventListener('click', function () {
      if (el.parentNode) el.parentNode.removeChild(el)
    })

    return el
  }

  /* --------------------------------------------------------------- utils */

  function api(path, options) {
    var opts = options || {}
    var init = { method: opts.method || 'GET', headers: { Accept: 'application/json' } }
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json'
      init.body = JSON.stringify(opts.body)
    }
    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (key) {
        init.headers[key] = opts.headers[key]
      })
    }

    return fetch(path, init).then(function (response) {
      return response
        .json()
        .catch(function () {
          return {}
        })
        .then(function (data) {
          return { ok: response.ok, status: response.status, data: data }
        })
    })
  }

  function track(platform, label) {
    var payload = JSON.stringify({
      platform: platform,
      referer: window.location.pathname,
      label: label || '',
    })
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/click', new Blob([payload], { type: 'application/json' }))
        return
      }
    } catch (error) {
      /* fall through to fetch */
    }
    try {
      fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
    } catch (error) {
      /* analytics is best-effort only */
    }
  }

  /* -------------------------------------------------------------- drawer */

  var lastFocus = null

  // Chrome elements are re-queried per use instead of captured once: the App
  // Router replaces the header/footer DOM when it restores a page client-side,
  // which would otherwise leave these references pointing at detached nodes.
  function drawerNode() {
    return doc.querySelector('[data-pd-drawer]')
  }

  function burgerNode() {
    return doc.querySelector('[data-pd-burger]')
  }

  function scrimNode() {
    return doc.querySelector('[data-pd-scrim]')
  }

  function openDrawer() {
    var drawer = drawerNode()
    var burger = burgerNode()
    var scrim = scrimNode()
    if (!drawer || !burger) return
    lastFocus = doc.activeElement
    drawer.hidden = false
    if (scrim) scrim.hidden = false
    // Force a reflow so the transform transition runs from the off-canvas state.
    drawer.getBoundingClientRect()
    drawer.classList.add('is-open')
    burger.setAttribute('aria-expanded', 'true')
    doc.body.style.overflow = 'hidden'
    var first = drawer.querySelector('.pd-drawer__link, [data-pd-close]')
    if (first) first.focus()
  }

  function closeDrawer() {
    var drawer = drawerNode()
    var burger = burgerNode()
    var scrim = scrimNode()
    if (!drawer || !burger || drawer.hidden) return
    drawer.classList.remove('is-open')
    burger.setAttribute('aria-expanded', 'false')
    doc.body.style.overflow = ''
    if (scrim) scrim.hidden = true
    window.setTimeout(function () {
      var live = drawerNode()
      if (live && !live.classList.contains('is-open')) live.hidden = true
    }, 300)
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus()
  }

  /* Delegated from the document so burger/close/back-to-top keep working after
     the chrome DOM is re-created by a client-side navigation. */
  doc.addEventListener('click', function (event) {
    var target = event.target
    if (!target || !target.closest) return

    if (target.closest('[data-pd-burger]')) {
      var drawer = drawerNode()
      if (drawer && drawer.classList.contains('is-open')) closeDrawer()
      else openDrawer()
      return
    }

    if (target.closest('[data-pd-close]')) {
      event.preventDefault()
      closeDrawer()
      return
    }

    if (target.closest('[data-pd-drawer] a[href]')) {
      closeDrawer()
      return
    }

    if (target.closest('[data-pd-totop]')) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  doc.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDrawer()
  })

  /* ------------------------------------------- header + progress + totop */

  var ticking = false

  function renderScrollState() {
    ticking = false
    var header = doc.querySelector('[data-pd-header]')
    var progress = doc.querySelector('[data-pd-progress]')
    var totop = doc.querySelector('[data-pd-totop]')
    var scrollTop = window.pageYOffset || doc.documentElement.scrollTop || 0
    var height = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight)

    if (header) header.classList.toggle('is-scrolled', scrollTop > 8)
    if (progress) progress.style.width = Math.min(100, (scrollTop / height) * 100).toFixed(2) + '%'
    if (totop) totop.hidden = scrollTop < 480
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(renderScrollState)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  renderScrollState()

  /* ---------------------------------------------------- anchor scrolling */

  doc.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null
    if (!link) return
    var id = link.getAttribute('href')
    if (!id || id === '#' || id === '#top') {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    var target = doc.querySelector(id)
    if (!target) return
    event.preventDefault()
    var header = doc.querySelector('[data-pd-header]')
    var offset = header ? header.offsetHeight + 12 : 0
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset
    window.scrollTo({ top: top, behavior: 'smooth' })
    if (history.replaceState) history.replaceState(null, '', id)
  })


  /* ------------------------------------------------ card pointer light
     Feeds the cursor position into --pd-px / --pd-py so the card's radial
     highlight follows the pointer. Delegated from the document and rAF-throttled:
     one listener regardless of how many cards exist, and at most one style
     write per frame per card.

     Skipped entirely on touch-primary devices, where there is no cursor to
     track and the highlight would be stuck at a stale coordinate. `any-pointer`
     (rather than `pointer`) so a touchscreen laptop that also has a mouse still
     gets the effect — only pure-touch devices opt out. */
  var finePointer =
    window.matchMedia && window.matchMedia('(hover: hover) and (any-pointer: fine)').matches
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function clearTilt(card) {
    card.classList.remove('is-tilting')
    card.style.removeProperty('--pd-tilt-x')
    card.style.removeProperty('--pd-tilt-y')
  }

  if (finePointer) {
    var tracked = null
    var frame = 0
    var lastX = 0
    var lastY = 0

    function placeLight() {
      frame = 0
      if (!tracked) return
      var rect = tracked.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      var nx = (lastX - rect.left) / rect.width
      var ny = (lastY - rect.top) / rect.height
      // lastX/lastY are viewport-relative (clientX/clientY), matching rect.
      tracked.style.setProperty('--pd-px', (nx * 100).toFixed(2) + '%')
      tracked.style.setProperty('--pd-py', (ny * 100).toFixed(2) + '%')
      // 3D tilt: up to ~5 degrees around each axis; the card's own CSS turns
      // the variables into a perspective transform. Skipped under reduced
      // motion, where the highlight alone is enough feedback.
      if (!reduceMotion) {
        tracked.style.setProperty('--pd-tilt-x', ((0.5 - ny) * 5).toFixed(2) + 'deg')
        tracked.style.setProperty('--pd-tilt-y', ((nx - 0.5) * 5).toFixed(2) + 'deg')
        tracked.classList.add('is-tilting')
      }
    }

    doc.addEventListener(
      'pointermove',
      function (event) {
        if (event.pointerType !== 'mouse') return
        var card = event.target.closest && event.target.closest('.pd-card')
        if (!card) return
        // Track movement within the same card too — bailing out when the card
        // is unchanged would freeze the highlight on first contact.
        tracked = card
        lastX = event.clientX
        lastY = event.clientY
        if (!frame) frame = window.requestAnimationFrame(placeLight)
      },
      { passive: true },
    )

    // Relax the tilt when the pointer leaves the card (or the page), so the
    // card settles flat with the long spring instead of freezing at its last
    // angle.
    doc.addEventListener('pointerout', function (event) {
      if (event.pointerType !== 'mouse' || !tracked) return
      if (event.relatedTarget && tracked.contains(event.relatedTarget)) return
      clearTilt(tracked)
      tracked = null
    })
  }

  /* ---------------------------------------------------------- reveal */

  var revealNodes = doc.querySelectorAll('.pd-reveal')

  if (revealNodes.length) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      )
      Array.prototype.forEach.call(revealNodes, function (node) {
        observer.observe(node)
      })
    } else {
      Array.prototype.forEach.call(revealNodes, function (node) {
        node.classList.add('is-visible')
      })
    }
  }

  /* ------------------------------------------------- live status pill */

  var statusNode = doc.querySelector('[data-pd-status]')
  var livePill = doc.querySelector('[data-pd-live]')

  function loadStatus() {
    if (!statusNode) return
    api('/api/health').then(function (result) {
      var text = statusNode.querySelector('[data-pd-status-text]')
      if (!result.ok || !result.data || !result.data.ok) {
        if (text) text.textContent = 'Status unavailable'
        return
      }
      var data = result.data
      var messages = data.data && data.data.messages ? data.data.messages.all : 0
      if (text) {
        text.textContent =
          'Operational · ' + messages + ' message' + (messages === 1 ? '' : 's') + ' received'
      }
      if (livePill) {
        livePill.hidden = false
        var liveText = livePill.querySelector('[data-pd-live-text]')
        if (liveText && data.profile && data.profile.availability) {
          liveText.textContent = data.profile.availability
        }
      }
    })
  }

  loadStatus()

  /* ------------------------------------------------- copy to clipboard */

  doc.addEventListener('click', function (event) {
    var trigger = event.target && event.target.closest ? event.target.closest('[data-pd-copy]') : null
    if (!trigger) return
    event.preventDefault()
    var value = trigger.getAttribute('data-pd-copy') || ''
    if (!value) return

    var done = function () {
      toast(value, { type: 'success', title: 'Copied to clipboard' })
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(done, function () {
        window.prompt('Copy this address:', value)
      })
      return
    }
    window.prompt('Copy this address:', value)
  })

  /* ------------------------------------------------ connect click track */

  doc.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('[data-pd-connect]') : null
    if (!link) return
    track(link.getAttribute('data-pd-connect'), (link.textContent || '').trim().slice(0, 60))
  })

  /* ------------------------------------------------------- public API */

  window.Portfolio = {
    api: api,
    toast: toast,
    track: track,
    closeDrawer: closeDrawer,
  }
})()

