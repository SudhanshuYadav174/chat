// Initialize 3D space background
function initSpaceBackground() {
  const container = document.getElementById("space-bg");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Create stars
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = window.innerWidth < 768 ? 2000 : 5000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 2000;
    positions[i3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i3 + 2] = (Math.random() - 0.5) * 2000;
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0x6699ff,
    size: window.innerWidth < 768 ? 0.8 : 1,
    transparent: true,
    opacity: 0.8,
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Camera position
  camera.position.z = 500;

  // Animation
  function animate() {
    requestAnimationFrame(animate);
    stars.rotation.x += 0.0001;
    stars.rotation.y += 0.0001;
    renderer.render(scene, camera);
  }

  animate();

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Initialize chat functionality
function initChat() {
  const socket = io();
  let username = "";
  let userCount = 0;

  // Prompt for name with validation before anything else
  while (!username || username.length > 15) {
    username = prompt("Enter your name (max 15 characters):") || "Anonymous";
  }

  // Now that we have username, initialize the rest
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const closeMenuBtn = document.getElementById("close-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileUsername = document.getElementById("mobile-username");
  const mobileUsernameInitial = document.getElementById(
    "mobile-username-initial"
  );
  const userCountElement = document.getElementById("user-count");

  // Display username
  mobileUsername.textContent = username;
  mobileUsernameInitial.textContent = username.charAt(0).toUpperCase();

  socket.emit("new-user", username);

  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const messages = document.getElementById("messages");
  const typing = document.getElementById("typing");

  // Mobile menu toggle
  if (mobileMenuBtn && closeMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.remove("hidden");
    });

    closeMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  }

  // Calculate appropriate bubble width based on message length
  function getBubbleWidth(message) {
    const length = message.length;
    if (length < 15) return "w-auto";
    if (length < 30) return "max-w-[65%]";
    if (length < 50) return "max-w-[75%]";
    return "max-w-[85%]";
  }

  // Create message element with proper structure
  function createMessageElement(name, message, isCurrentUser = false) {
    const msg = document.createElement("div");
    msg.classList.add("mb-4", "break-words", "w-full");

    // Ensure message is properly converted to string
    const messageText =
      typeof message === "string"
        ? message
        : message.message
        ? message.message
        : JSON.stringify(message);
    const bubbleWidth = getBubbleWidth(messageText);
    const messageClass = isCurrentUser ? "message-self" : "message-other";
    const alignmentClass = isCurrentUser ? "items-end" : "items-start";

    if (isCurrentUser) {
      msg.innerHTML = `
        <div class="flex flex-col ${alignmentClass} w-full">
          <div class="text-xs text-indigo-300 mb-1 glow-text">You</div>
          <div class="${messageClass} rounded-lg p-3 text-sm ${bubbleWidth}">
            ${messageText}
          </div>
        </div>
      `;
    } else {
      msg.innerHTML = `
        <div class="flex ${alignmentClass} w-full">
          <div class="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center mr-2 glow-border flex-shrink-0">
            <span class="text-sm">${name.charAt(0).toUpperCase()}</span>
          </div>
          <div class="flex flex-col" style="max-width: calc(100% - 40px);">
            <div class="text-xs text-indigo-300 mb-1 glow-text">${name}</div>
            <div class="${messageClass} rounded-lg p-3 text-sm ${bubbleWidth}">
              ${messageText}
            </div>
          </div>
        </div>
      `;
    }

    return msg;
  }

  // Handle received messages
  socket.on("chat-message", (data) => {
    // Properly handle different data formats
    let name, message;
    if (typeof data === "object" && data.name) {
      name = data.name;
      message = data.message;
    } else if (typeof data === "string") {
      name = "System";
      message = data;
    } else {
      name = "Unknown";
      message = "New message";
    }

    const isCurrentUser = name === username;
    const msg = createMessageElement(name, message, isCurrentUser);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  });

  socket.on("user-connected", (name) => {
    userCount++;
    updateUserCount();
    const div = document.createElement("div");
    div.className = "text-center text-green-300 text-xs my-2 glow-text";
    div.innerText = `🚀 ${name} joined`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  });

  socket.on("user-disconnected", (name) => {
    userCount--;
    updateUserCount();
    const div = document.createElement("div");
    div.className = "text-center text-red-300 text-xs my-2 glow-text";
    div.innerText = `🌌 ${name} left`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  });

  socket.on("typing", (name) => {
    if (name !== username) {
      typing.innerText = `${name} is typing...`;
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        typing.innerText = "";
      }, 2000);
    }
  });

  function updateUserCount() {
    if (userCountElement) {
      userCountElement.textContent = userCount;
    }
  }

  // Handle message submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (message) {
      socket.emit("send-chat-message", {
        name: username,
        message: message,
      });

      const msg = createMessageElement(username, message, true);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;

      input.value = "";
      typing.innerText = "";
    }
  });

  // Typing indicator
  let typingTimeout;
  input.addEventListener("input", () => {
    if (input.value.trim().length > 0) {
      socket.emit("typing", username);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit("typing", false);
      }, 2000);
    } else {
      socket.emit("typing", false);
    }
  });

  // Focus input on load and adjust for mobile keyboard
  input.focus();
  if (window.innerWidth < 768) {
    window.addEventListener("resize", () => {
      setTimeout(() => {
        messages.scrollTop = messages.scrollHeight;
      }, 300);
    });
  }
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initSpaceBackground();
  initChat();
});
