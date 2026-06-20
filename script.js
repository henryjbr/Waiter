const form = document.querySelector("#authForm");
const modeButtons = document.querySelectorAll(".mode-button");
const signupOnlyFields = document.querySelectorAll("[data-signup-only]");
const formTitle = document.querySelector("#formTitle");
const formSubtitle = document.querySelector("#formSubtitle");
const submitButton = document.querySelector("#submitButton");
const forgotLink = document.querySelector("#forgotLink");
const nameLabel = document.querySelector("#nameLabel");
const nameInput = document.querySelector("#name");
const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#togglePassword");
const strengthBar = document.querySelector("#strengthBar");
const strengthText = document.querySelector("#strengthText");
const formAlert = document.querySelector("#formAlert");
const authShell = document.querySelector("#authShell");
const dashboardShell = document.querySelector("#dashboardShell");
const logoutButton = document.querySelector("#logoutButton");
const dashboardGreeting = document.querySelector("#dashboardGreeting");
const adminName = document.querySelector("#adminName");
const adminInitial = document.querySelector("#adminInitial");
const restaurantForm = document.querySelector("#restaurantForm");
const restaurantList = document.querySelector("#restaurantList");
const restaurantCount = document.querySelector("#restaurantCount");
const selectedRestaurantName = document.querySelector("#selectedRestaurantName");
const selectedRestaurantMeta = document.querySelector("#selectedRestaurantMeta");
const selectedStatusDot = document.querySelector("#selectedStatusDot");
const seedOrderButton = document.querySelector("#seedOrderButton");
const ordersTableBody = document.querySelector("#ordersTableBody");
const emptyOrders = document.querySelector("#emptyOrders");
const filterButtons = document.querySelectorAll(".filter-button");

let currentMode = "login";
let currentStatusFilter = "all";
let adminState = null;

const storageKey = "waiterAdminState";
const copyByMode = {
  login: {
    title: "Entrar no painel",
    subtitle: "Use seu nome de acesso e senha para continuar gerenciando o restaurante.",
    button: "Entrar no admin",
    success: "Login validado. Pronto para conectar com seu backend."
  },
  signup: {
    title: "Criar conta admin",
    subtitle: "Configure o primeiro acesso administrativo do seu restaurante.",
    button: "Criar conta",
    success: "Conta preparada. Agora falta ligar essa tela ao cadastro real."
  }
};

function setMode(mode) {
  currentMode = mode;
  const isSignup = mode === "signup";

  form.classList.toggle("login-mode", !isSignup);
  form.classList.toggle("signup-mode", isSignup);

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  signupOnlyFields.forEach((field) => {
    field.classList.toggle("show", isSignup);
  });

  formTitle.textContent = copyByMode[mode].title;
  formSubtitle.textContent = copyByMode[mode].subtitle;
  submitButton.textContent = copyByMode[mode].button;
  forgotLink.classList.toggle("is-muted", isSignup);
  nameLabel.textContent = isSignup ? "Nome completo" : "Nome de acesso";
  nameInput.placeholder = isSignup ? "Seu nome completo" : "Digite seu nome";
  nameInput.setAttribute("autocomplete", isSignup ? "name" : "username");
  passwordInput.setAttribute("autocomplete", isSignup ? "new-password" : "current-password");

  clearErrors();
  hideAlert();
  updatePasswordStrength();
}

function showError(fieldName, message) {
  const field = form.elements[fieldName];
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);

  if (field) {
    field.classList.add("has-error");
  }

  if (error) {
    error.textContent = message;
  }
}

function clearErrors() {
  form.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function hideAlert() {
  formAlert.classList.remove("show");
  formAlert.textContent = "";
}

function validateForm() {
  clearErrors();

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const password = String(data.get("password") || "");
  const restaurant = String(data.get("restaurant") || "").trim();
  let isValid = true;

  if (name.length < 3) {
    showError("name", currentMode === "signup" ? "Informe seu nome completo." : "Informe seu nome de acesso.");
    isValid = false;
  }

  if (password.length < 8) {
    showError("password", "A senha precisa ter pelo menos 8 caracteres.");
    isValid = false;
  }

  if (currentMode === "signup" && restaurant.length < 2) {
    showError("restaurant", "Informe o nome do restaurante.");
    isValid = false;
  }

  return isValid;
}

function getPasswordScore(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return score;
}

function updatePasswordStrength() {
  if (currentMode !== "signup") return;

  const score = getPasswordScore(passwordInput.value);
  const states = [
    { width: "0%", text: "Informe uma senha", color: "var(--danger)" },
    { width: "25%", text: "Senha fraca", color: "var(--danger)" },
    { width: "55%", text: "Senha razoável", color: "var(--gold)" },
    { width: "78%", text: "Senha boa", color: "var(--accent)" },
    { width: "100%", text: "Senha forte", color: "var(--accent-dark)" }
  ];
  const state = states[score];

  strengthBar.style.width = state.width;
  strengthBar.style.background = state.color;
  strengthText.textContent = state.text;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createInitialState(userName, firstRestaurantName) {
  const firstRestaurant = {
    id: createId("restaurant"),
    name: firstRestaurantName || "Bistrô Central",
    category: "Contemporâneo",
    status: "Aberto",
    orders: [
      {
        id: "1024",
        items: "Risoto de limão, água com gás",
        status: "Preparando",
        time: "12:42"
      },
      {
        id: "1023",
        items: "Burger da casa, batata rústica",
        status: "Pendente",
        time: "12:35"
      },
      {
        id: "1022",
        items: "Tiramisù, espresso",
        status: "Entregue",
        time: "12:18"
      }
    ]
  };
  const restaurants = [firstRestaurant];

  if (!firstRestaurantName) {
    restaurants.push({
      id: createId("restaurant"),
      name: "Casa Aurora",
      category: "Cozinha brasileira",
      status: "Aberto",
      orders: [
        {
          id: "2021",
          items: "Moqueca, arroz, suco de caju",
          status: "Preparando",
          time: "13:02"
        },
        {
          id: "2020",
          items: "Entrada da casa, dois pratos executivos",
          status: "Entregue",
          time: "12:51"
        }
      ]
    });
  }

  return {
    adminName: userName || "Admin",
    selectedRestaurantId: restaurants[0].id,
    restaurants
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(adminState));
}

function loadState(userName, firstRestaurantName) {
  const savedState = localStorage.getItem(storageKey);

  if (savedState && currentMode === "login") {
    adminState = JSON.parse(savedState);
    adminState.adminName = userName || adminState.adminName;
    return;
  }

  adminState = createInitialState(userName, firstRestaurantName);
  saveState();
}

function getSelectedRestaurant() {
  if (!adminState.restaurants.length) return null;

  return adminState.restaurants.find((restaurant) => {
    return restaurant.id === adminState.selectedRestaurantId;
  }) || adminState.restaurants[0];
}

function setText(element, value) {
  element.textContent = value;
}

function renderDashboard() {
  const selectedRestaurant = getSelectedRestaurant();
  const allOrders = adminState.restaurants.flatMap((restaurant) => restaurant.orders);

  setText(dashboardGreeting, `Olá, ${adminState.adminName}`);
  setText(adminName, adminState.adminName);
  setText(adminInitial, adminState.adminName.trim().charAt(0).toUpperCase() || "A");
  setText(restaurantCount, adminState.restaurants.length);

  if (selectedRestaurant) {
    adminState.selectedRestaurantId = selectedRestaurant.id;
    setText(selectedRestaurantName, selectedRestaurant.name);
    setText(
      selectedRestaurantMeta,
      `${selectedRestaurant.category} · ${selectedRestaurant.orders.length} pedidos`
    );
    selectedStatusDot.classList.remove("hidden");
    seedOrderButton.disabled = false;
  } else {
    setText(selectedRestaurantName, "Nenhum restaurante selecionado");
    setText(selectedRestaurantMeta, "Crie um restaurante para começar a acompanhar pedidos.");
    selectedStatusDot.classList.add("hidden");
    seedOrderButton.disabled = true;
  }

  renderRestaurants();
  renderOrders(selectedRestaurant);
}

function renderRestaurants() {
  restaurantList.innerHTML = "";

  if (!adminState.restaurants.length) {
    const empty = document.createElement("p");
    empty.className = "sidebar-empty";
    empty.textContent = "Nenhum restaurante criado ainda.";
    restaurantList.appendChild(empty);
    return;
  }

  adminState.restaurants.forEach((restaurant) => {
    const button = document.createElement("button");
    const title = document.createElement("strong");
    const meta = document.createElement("span");

    button.type = "button";
    button.className = "restaurant-item";
    button.classList.toggle("active", restaurant.id === adminState.selectedRestaurantId);
    title.textContent = restaurant.name;
    meta.textContent = `${restaurant.category} · ${restaurant.orders.length} pedidos`;

    button.append(title, meta);
    button.addEventListener("click", () => {
      adminState.selectedRestaurantId = restaurant.id;
      saveState();
      renderDashboard();
    });

    restaurantList.appendChild(button);
  });
}

function renderOrders(restaurant) {
  ordersTableBody.innerHTML = "";

  const orders = restaurant
    ? restaurant.orders.filter((order) => currentStatusFilter === "all" || order.status === currentStatusFilter)
    : [];

  emptyOrders.classList.toggle("hidden", orders.length > 0);

  orders.forEach((order) => {
    const row = document.createElement("tr");
    const statusClass = {
      Pendente: "pending",
      Preparando: "preparing",
      Entregue: "delivered"
    }[order.status];

    [
      `#${order.id}`,
      order.items,
      order.status,
      order.time
    ].forEach((value, index) => {
      const cell = document.createElement("td");

      if (index === 2) {
        const chip = document.createElement("span");
        chip.className = `status-chip ${statusClass}`;
        chip.textContent = value;
        cell.appendChild(chip);
      } else {
        cell.textContent = value;
      }

      row.appendChild(cell);
    });

    ordersTableBody.appendChild(row);
  });
}

function showDashboardError(fieldName, message) {
  const field = restaurantForm.elements[fieldName];
  const error = document.querySelector(`[data-dashboard-error-for="${fieldName}"]`);

  field.classList.add("has-error");
  error.textContent = message;
}

function clearDashboardErrors() {
  restaurantForm.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  restaurantForm.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function enterDashboard() {
  const data = new FormData(form);
  const userName = String(data.get("name") || "").trim();
  const firstRestaurantName = String(data.get("restaurant") || "").trim();

  loadState(userName, currentMode === "signup" ? firstRestaurantName : "");
  authShell.classList.add("hidden");
  dashboardShell.classList.remove("hidden");
  renderDashboard();
}

function createRestaurant(event) {
  event.preventDefault();
  clearDashboardErrors();

  const data = new FormData(restaurantForm);
  const name = String(data.get("restaurantName") || "").trim();
  const category = String(data.get("restaurantCategory") || "").trim() || "Restaurante";

  if (name.length < 2) {
    showDashboardError("restaurantName", "Informe o nome do restaurante.");
    return;
  }

  const restaurant = {
    id: createId("restaurant"),
    name,
    category,
    status: "Aberto",
    orders: []
  };

  adminState.restaurants.unshift(restaurant);
  adminState.selectedRestaurantId = restaurant.id;
  saveState();
  restaurantForm.reset();
  renderDashboard();
}

function addDemoOrder() {
  const restaurant = getSelectedRestaurant();
  if (!restaurant) return;

  const menuItems = [
    "Salada da casa, suco natural",
    "Parmegiana, arroz, batata",
    "Pizza individual, refrigerante",
    "Salmão grelhado, legumes",
    "Hambúrguer artesanal, batata"
  ];
  const statuses = ["Pendente", "Preparando", "Entregue"];
  const now = new Date();
  const order = {
    id: String(Math.floor(1000 + Math.random() * 9000)),
    items: menuItems[Math.floor(Math.random() * menuItems.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  };

  restaurant.orders.unshift(order);
  saveState();
  renderDashboard();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Ocultar" : "Mostrar";
  togglePassword.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

passwordInput.addEventListener("input", updatePasswordStrength);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hideAlert();

  if (!validateForm()) return;

  formAlert.textContent = copyByMode[currentMode].success;
  formAlert.classList.add("show");
  setTimeout(enterDashboard, 450);
});

restaurantForm.addEventListener("submit", createRestaurant);
seedOrderButton.addEventListener("click", addDemoOrder);
logoutButton.addEventListener("click", () => {
  dashboardShell.classList.add("hidden");
  authShell.classList.remove("hidden");
  form.reset();
  setMode("login");
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentStatusFilter = button.dataset.status;
    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    renderDashboard();
  });
});
