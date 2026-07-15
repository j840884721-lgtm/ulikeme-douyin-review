(() => {
  const sessionKey = "ulikeme_report_access";
  const passwordHash = "3554d21adf5d472c3cf4b6fdea252e93056e322c939cb5dd69865f3b00a84fe2";

  if (sessionStorage.getItem(sessionKey) === "granted") return;

  document.documentElement.classList.add("access-locked");
  const style = document.createElement("style");
  style.textContent = `
    .access-locked body > :not(#access-gate) { display: none !important; }
    #access-gate {
      position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
      padding: 20px; color: #17202a; background: #f4f6f8;
      font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
    }
    #access-gate form { width: min(360px, 100%); padding: 28px; background: #fff; border: 1px solid #dce3e8; }
    #access-gate h1 { margin: 0 0 8px; font-size: 20px; letter-spacing: 0; }
    #access-gate p { margin: 0 0 18px; color: #687684; font-size: 13px; }
    #access-gate input { width: 100%; height: 42px; padding: 0 11px; border: 1px solid #cfd7dd; font: inherit; }
    #access-gate button { width: 100%; height: 42px; margin-top: 10px; border: 0; color: #fff; background: #df3e72; font: inherit; font-weight: 700; cursor: pointer; }
    #access-error { min-height: 18px; margin: 8px 0 0 !important; color: #b8323a !important; }
  `;
  document.head.appendChild(style);

  async function hash(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function showGate() {
    const gate = document.createElement("div");
    gate.id = "access-gate";
    gate.innerHTML = `
      <form>
        <h1>请输入访问密码</h1>
        <p>验证后可查看投放复盘页面</p>
        <input type="password" autocomplete="current-password" aria-label="访问密码" autofocus />
        <button type="submit">进入报告</button>
        <p id="access-error" role="alert"></p>
      </form>
    `;
    document.body.appendChild(gate);

    const form = gate.querySelector("form");
    const input = gate.querySelector("input");
    const error = gate.querySelector("#access-error");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (await hash(input.value) !== passwordHash) {
        error.textContent = "密码错误，请重新输入";
        input.select();
        return;
      }
      sessionStorage.setItem(sessionKey, "granted");
      document.documentElement.classList.remove("access-locked");
      gate.remove();
    });
    input.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showGate, { once: true });
  } else {
    showGate();
  }
})();
