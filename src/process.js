const html = await loadHtml("body.html");

class proc extends ThirdPartyAppProcess {
  constructor(handler, pid, parentPid, app, workingDirectory) {
    super(handler, pid, parentPid, app, workingDirectory);
  }

  async start() {
    if (await this.closeIfSecondInstance()) return;
  }

  async render() {
    this.win = this.getWindow();

    const publicUserInfo = await this.userDaemon.getPublicUserInfoOf(
      this.userDaemon.userInfo._id
    );
    const username =
      this.userPreferences().account.displayName || this.username;
    const body = this.getBody();

    body.innerHTML = html;

    this.profilePictureEl = body.querySelector("#profilePicture");
    this.usernameEl = body.querySelector("#username");
    this.statusEl = body.querySelector("#status");
    this.passwordField = body.querySelector("#passwordField");
    this.unlockButton = body.querySelector("#unlockButton");
    this.shutdownButton = body.querySelector("#shutdown");

    this.profilePictureEl.src = publicUserInfo.profilePicture;
    this.usernameEl.innerText = username;

    this.passwordField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.validate();
    });

    this.unlockButton.addEventListener("click", () => {
      this.validate();
    });

    this.shutdownButton.addEventListener("click", () => {
      this.userDaemon?.shutdown();
    });

    const lockIcon = document.createElement("span");
    lockIcon.className = "lucide icon-lock-keyhole";
    this.lockButton = document.createElement("button");
    this.lockButton.className = "lock-screen";
    this.lockButton.append(lockIcon);
    this.lockButton.addEventListener("click", () => {
      this.show();
    });

    const actions = document.querySelector(
      "#arcShell div.startmenu div.actions"
    );

    actions?.append(this.lockButton);
  }

  async validate() {
    this.unlockButton.disabled = true;
    this.passwordField.disabled = true;
    this.shutdownButton.disabled = true;

    const form = new FormData();
    form.set("identity", this.username);
    form.set("password", this.passwordField.value);
    form.set("userAgent", navigator.userAgent);

    try {
      const response = await Server.post(`/login`, form);

      if (response.status !== 200) throw "";

      this.userDaemon.discontinueToken(response.data.token);
    } catch {
      this.statusEl.innerText = "Incorrect password!";
      this.statusEl.classList.add("incorrect-password");

      await Sleep(2000);

      this.reset();

      return;
    }

    this.hide();
  }

  show() {
    this.win.classList.add("activated");
    this.userDaemon._elevating = true;
  }

  async hide() {
    this.win.classList.remove("activated");
    this.userDaemon._elevating = false;
    await Sleep(300);
    this.reset();
  }

  reset() {
    this.passwordField.value = "";
    this.passwordField.disabled = false;
    this.unlockButton.disabled = false;
    this.shutdownButton.disabled = false;
    this.statusEl.innerText = "ArcOS is locked";
    this.statusEl.classList.remove("incorrect-password");
  }

  async stop() {
    this.lockButton?.remove();
  }
}

return { proc };
