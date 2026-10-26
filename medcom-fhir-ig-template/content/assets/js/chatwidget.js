/*!
 * ChatWidget.js v1.0.0
 * A tiny, dependency-free floating chat widget you can drop into any site.
 * https://github.com/YOUR_USERNAME/chatwidget-js
 * MIT License
 */
(function (global, factory) {
  typeof module === "object" && typeof module.exports === "object"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : (global.ChatWidget = factory());
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var ICON_OPEN =
    '<svg viewBox="0 0 24 24" fill="none" class="cw-icon-open"><path d="M4 4h16v12H7l-3 3V4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" class="cw-icon-close"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_X =
    '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var DEFAULTS = {
    title: "Chat with us",
    subtitle: "We typically reply in a few minutes",
    greeting: "Hi! How can I help you today?",
    placeholder: "Type your message…",
    avatar: null, // URL string, or null for a default bubble icon
    position: "right", // 'right' | 'left'
    theme: "light", // 'light' | 'dark' | 'auto'
    primaryColor: null, // overrides --cw-primary if set
    footerNote: "", // e.g. "Powered by YourApp"
    startOpen: false,
    container: null, // custom mount node, defaults to document.body
    onMessage: null // function(text, helpers)
  };

  var idCounter = 0;

  function el(html) {
    var wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    return wrap.firstChild;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function ChatWidgetInstance(options) {
    this.options = Object.assign({}, DEFAULTS, options || {});
    this.id = "cw-" + ++idCounter;
    this._build();
    this._bind();
    if (this.options.greeting) {
      this.addMessage("bot", this.options.greeting);
    }
    if (this.options.startOpen) {
      this.open();
    }
  }

  ChatWidgetInstance.prototype._build = function () {
    var o = this.options;
    var avatarInner = o.avatar
      ? '<img src="' + o.avatar + '" alt="" />'
      : '<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 2a5 5 0 015 5c0 2-1.2 3.6-3 4.4V13h-4v-1.6c-1.8-.8-3-2.4-3-4.4a5 5 0 015-5zM9 21v-2a3 3 0 013-3 3 3 0 013 3v2H9z" fill="currentColor"/></svg>';

    var root = el(
      '<div class="cw-widget cw-pos-' +
        o.position +
        '" data-cw-theme="' +
        o.theme +
        '" id="' +
        this.id +
        '">' +
        '<div class="cw-panel" role="dialog" aria-modal="false" aria-hidden="true" aria-label="' +
        escapeHtml(o.title) +
        '">' +
        '<div class="cw-header">' +
        '<div class="cw-avatar">' +
        avatarInner +
        "</div>" +
        '<div class="cw-header-text">' +
        '<div class="cw-title"></div>' +
        '<div class="cw-subtitle"></div>' +
        "</div>" +
        '<button type="button" class="cw-close" aria-label="Close chat">' +
        ICON_X +
        "</button>" +
        "</div>" +
        '<div class="cw-messages" role="log" aria-live="polite"></div>' +
        '<div class="cw-typing" hidden><span></span><span></span><span></span></div>' +
        '<form class="cw-input-row">' +
        '<textarea class="cw-input" rows="1"></textarea>' +
        '<button type="submit" class="cw-send" aria-label="Send message">' +
        ICON_SEND +
        "</button>" +
        "</form>" +
        (o.footerNote
          ? '<div class="cw-footer-note"></div>'
          : "") +
        "</div>" +
        '<button type="button" class="cw-launcher" aria-label="Open chat">' +
        ICON_OPEN +
        ICON_CLOSE +
        "</button>" +
        "</div>"
    );

    if (o.primaryColor) {
      root.style.setProperty("--cw-primary", o.primaryColor);
    }

    root.querySelector(".cw-title").textContent = o.title;
    root.querySelector(".cw-subtitle").textContent = o.subtitle;
    root.querySelector(".cw-input").placeholder = o.placeholder;
    if (o.footerNote) {
      root.querySelector(".cw-footer-note").textContent = o.footerNote;
    }

    this.root = root;
    this.launcher = root.querySelector(".cw-launcher");
    this.panel = root.querySelector(".cw-panel");
    this.messagesEl = root.querySelector(".cw-messages");
    this.typingEl = root.querySelector(".cw-typing");
    this.form = root.querySelector(".cw-input-row");
    this.input = root.querySelector(".cw-input");
    this.closeBtn = root.querySelector(".cw-close");

    (o.container || document.body).appendChild(root);
  };

  ChatWidgetInstance.prototype._bind = function () {
    var self = this;

    this.launcher.addEventListener("click", function () {
      self.toggle();
    });
    this.closeBtn.addEventListener("click", function () {
      self.close();
    });

    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      self._send();
    });

    this.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        self._send();
      }
    });

    this.input.addEventListener("input", function () {
      self.input.style.height = "auto";
      self.input.style.height = Math.min(self.input.scrollHeight, 100) + "px";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && self.root.classList.contains("cw-open")) {
        self.close();
      }
    });
  };

  ChatWidgetInstance.prototype._send = function () {
    var text = this.input.value.trim();
    if (!text) return;
    this.addMessage("user", text);
    this.input.value = "";
    this.input.style.height = "auto";

    this.root.dispatchEvent(
      new CustomEvent("cw:message", { detail: { text: text } })
    );

    if (typeof this.options.onMessage === "function") {
      var self = this;
      this.options.onMessage(text, {
        respond: function (reply) {
          self.addMessage("bot", reply);
        },
        showTyping: function () {
          self.showTyping();
        },
        hideTyping: function () {
          self.hideTyping();
        },
        widget: this
      });
    }
  };

  ChatWidgetInstance.prototype.addMessage = function (role, text) {
    var msg = el(
      '<div class="cw-msg cw-msg-' +
        (role === "user" ? "user" : "bot") +
        '"><div class="cw-bubble"></div></div>'
    );
    msg.querySelector(".cw-bubble").textContent = text;
    this.messagesEl.appendChild(msg);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    this.root.dispatchEvent(
      new CustomEvent("cw:response", { detail: { role: role, text: text } })
    );
    return msg;
  };

  ChatWidgetInstance.prototype.showTyping = function () {
    this.typingEl.hidden = false;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  };

  ChatWidgetInstance.prototype.hideTyping = function () {
    this.typingEl.hidden = true;
  };

  ChatWidgetInstance.prototype.open = function () {
    this.root.classList.add("cw-open");
    this.panel.setAttribute("aria-hidden", "false");
    this.root.dispatchEvent(new CustomEvent("cw:open"));
    var self = this;
    setTimeout(function () {
      self.input.focus();
    }, 150);
  };

  ChatWidgetInstance.prototype.close = function () {
    this.root.classList.remove("cw-open");
    this.panel.setAttribute("aria-hidden", "true");
    this.root.dispatchEvent(new CustomEvent("cw:close"));
  };

  ChatWidgetInstance.prototype.toggle = function () {
    if (this.root.classList.contains("cw-open")) {
      this.close();
    } else {
      this.open();
    }
  };

  ChatWidgetInstance.prototype.clear = function () {
    this.messagesEl.innerHTML = "";
  };

  ChatWidgetInstance.prototype.destroy = function () {
    this.root.remove();
  };

  return {
    init: function (options) {
      return new ChatWidgetInstance(options);
    }
  };
});
