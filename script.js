const form = document.querySelector("#authForm");
const modeButtons = document.querySelectorAll(".mode-button");
const dashboardTabs = document.querySelectorAll(".dashboard-tab");
const signupOnlyFields = document.querySelectorAll("[data-signup-only]");
const formTitle = document.querySelector("#formTitle");
const formSubtitle = document.querySelector("#formSubtitle");
const submitButton = document.querySelector("#submitButton");
const nameLabel = document.querySelector("#nameLabel");
const nameInput = document.querySelector("#name");
const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#togglePassword");
const formAlert = document.querySelector("#formAlert");
const authShell = document.querySelector("#authShell");
const dashboardShell = document.querySelector("#dashboardShell");
const restaurantDashboardShell = document.querySelector("#restaurantDashboardShell");
const logoutButton = document.querySelector("#logoutButton");
const restaurantLogoutButton = document.querySelector("#restaurantLogoutButton");
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
const filterButtons = document.querySelectorAll("[data-status]");
const menuForm = document.querySelector("#menuForm");
const menuTableBody = document.querySelector("#menuTableBody");
const emptyMenu = document.querySelector("#emptyMenu");
const activeMenuCount = document.querySelector("#activeMenuCount");
const restaurantGreeting = document.querySelector("#restaurantGreeting");
const restaurantInitial = document.querySelector("#restaurantInitial");
const restaurantUserName = document.querySelector("#restaurantUserName");
const restaurantPanelName = document.querySelector("#restaurantPanelName");
const restaurantPanelMeta = document.querySelector("#restaurantPanelMeta");
const seedMenuButton = document.querySelector("#seedMenuButton");
const menuFilterButtons = document.querySelectorAll(".menu-filter-button");
const menuDayButtons = document.querySelectorAll(".weekday-tab");
const menuDayTitle = document.querySelector("#menuDayTitle");
const categoryForm = document.querySelector("#categoryForm");
const subcategoryForm = document.querySelector("#subcategoryForm");
const subcategoryCategorySelect = document.querySelector("#subcategoryCategory");
const menuItemCategorySelect = document.querySelector("#menuItemCategory");
const menuItemSubcategorySelect = document.querySelector("#menuItemSubcategory");

let currentMode = "login";
let currentStatusFilter = "all";
let currentMenuFilter = "all";
let currentMenuDay = "monday";
let adminState = null;
let restaurantState = null;

const storageKey = "waiterAdminState";
const restaurantStorageKey = "waiterRestaurantState";
const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
const weekdays = [
  { id: "monday", label: "Segunda" },
  { id: "tuesday", label: "Terça" },
  { id: "wednesday", label: "Quarta" },
  { id: "thursday", label: "Quinta" },
  { id: "friday", label: "Sexta" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" }
];
const defaultWeekdays = weekdays.map((day) => day.id);
const copyByMode = {
  login: {
    title: "Entrar no painel",
    subtitle: "Use seu nick de acesso e senha para continuar gerenciando o restaurante.",
    button: "Entrar no painel",
    success: "Login validado. Pronto para conectar com seu backend."
  },
  signup: {
    title: "Criar conta",
    subtitle: "Configure seu acesso para controlar os dashboards.",
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

  updateAuthCopy();
  nameLabel.textContent = isSignup ? "Nick" : "Nick de acesso";
  nameInput.placeholder = isSignup ? "Crie seu nick" : "Digite seu nick";
  nameInput.setAttribute("autocomplete", isSignup ? "name" : "username");
  passwordInput.setAttribute("autocomplete", isSignup ? "new-password" : "current-password");

  clearErrors();
  hideAlert();
}

function updateAuthCopy() {
  const isSignup = currentMode === "signup";

  if (isSignup) {
    formTitle.textContent = copyByMode.signup.title;
    formSubtitle.textContent = copyByMode.signup.subtitle;
    submitButton.textContent = copyByMode.signup.button;
    return;
  }

  formTitle.textContent = copyByMode.login.title;
  formSubtitle.textContent = copyByMode.login.subtitle;
  submitButton.textContent = copyByMode.login.button;
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
    showError("name", currentMode === "signup" ? "Informe seu nick." : "Informe seu nick de acesso.");
    isValid = false;
  }

  if (password.trim().length === 0) {
    showError("password", "Informe sua senha.");
    isValid = false;
  }

  if (currentMode === "signup" && restaurant.length < 2) {
    showError("restaurant", "Informe o nome do restaurante.");
    isValid = false;
  }

  return isValid;
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

function createInitialRestaurantState(userName, restaurantName) {
  const categories = [
    {
      id: createId("category"),
      name: "Lanches",
      subcategories: [
        { id: createId("subcategory"), name: "Artesanais" }
      ]
    },
    {
      id: createId("category"),
      name: "Pratos",
      subcategories: [
        { id: createId("subcategory"), name: "Executivos" }
      ]
    },
    {
      id: createId("category"),
      name: "Bebidas",
      subcategories: [
        { id: createId("subcategory"), name: "Naturais" }
      ]
    }
  ];

  return {
    userName: userName || "Restaurante",
    restaurantName: restaurantName || "Bistrô Central",
    categories,
    menuItems: [
      {
        id: createId("menu"),
        name: "Burger da casa",
        categoryId: categories[0].id,
        subcategoryId: categories[0].subcategories[0].id,
        price: 32.9,
        status: "Ativo",
        days: ["friday", "saturday", "sunday"]
      },
      {
        id: createId("menu"),
        name: "Risoto de limão",
        categoryId: categories[1].id,
        subcategoryId: categories[1].subcategories[0].id,
        price: 48,
        status: "Ativo",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
      },
      {
        id: createId("menu"),
        name: "Tiramisù",
        categoryId: categories[1].id,
        subcategoryId: categories[1].subcategories[0].id,
        price: 24,
        status: "Pausado",
        days: ["saturday", "sunday"]
      }
    ]
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(adminState));
}

function saveRestaurantState() {
  localStorage.setItem(restaurantStorageKey, JSON.stringify(restaurantState));
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

function loadRestaurantState(userName, restaurantName) {
  const savedState = localStorage.getItem(restaurantStorageKey);

  if (savedState && currentMode === "login") {
    restaurantState = JSON.parse(savedState);
    restaurantState.userName = userName || restaurantState.userName;
    restaurantState.restaurantName = restaurantState.restaurantName || "Restaurante";
    restaurantState.menuItems = Array.isArray(restaurantState.menuItems) ? restaurantState.menuItems : [];
    normalizeRestaurantState();
    saveRestaurantState();
    return;
  }

  restaurantState = createInitialRestaurantState(userName, restaurantName);
  saveRestaurantState();
}

function normalizeRestaurantState() {
  restaurantState.categories = Array.isArray(restaurantState.categories) && restaurantState.categories.length
    ? restaurantState.categories
    : [
      { id: createId("category"), name: "Geral", subcategories: [{ id: createId("subcategory"), name: "Principal" }] }
    ];

  restaurantState.categories.forEach((category) => {
    category.subcategories = Array.isArray(category.subcategories) && category.subcategories.length
      ? category.subcategories
      : [{ id: createId("subcategory"), name: "Principal" }];
  });

  restaurantState.menuItems.forEach((item) => {
    if (!item.categoryId) {
      const category = findOrCreateCategory(item.category || "Geral");
      item.categoryId = category.id;
      item.subcategoryId = category.subcategories[0].id;
    }

    if (!item.subcategoryId) {
      const category = getCategoryById(item.categoryId);
      item.subcategoryId = category ? category.subcategories[0].id : "";
    }

    item.days = Array.isArray(item.days) && item.days.length ? item.days : [...defaultWeekdays];
  });
}

function getCategoryById(categoryId) {
  return restaurantState.categories.find((category) => category.id === categoryId);
}

function getSubcategoryById(category, subcategoryId) {
  if (!category) return null;
  return category.subcategories.find((subcategory) => subcategory.id === subcategoryId);
}

function findOrCreateCategory(categoryName) {
  const existingCategory = restaurantState.categories.find((category) => {
    return category.name.toLowerCase() === categoryName.toLowerCase();
  });

  if (existingCategory) return existingCategory;

  const category = {
    id: createId("category"),
    name: categoryName,
    subcategories: [{ id: createId("subcategory"), name: "Principal" }]
  };

  restaurantState.categories.push(category);
  return category;
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

function renderRestaurantDashboard() {
  const activeItems = restaurantState.menuItems.filter((item) => item.status === "Ativo").length;
  const currentDay = weekdays.find((day) => day.id === currentMenuDay);

  setText(restaurantGreeting, `Olá, ${restaurantState.userName}`);
  setText(restaurantUserName, restaurantState.userName);
  setText(restaurantInitial, restaurantState.userName.trim().charAt(0).toUpperCase() || "R");
  setText(restaurantPanelName, restaurantState.restaurantName);
  setText(restaurantPanelMeta, `${activeItems} itens ativos · ${restaurantState.categories.length} categorias`);
  setText(activeMenuCount, activeItems);
  setText(menuDayTitle, `Cardápio de ${currentDay.label.toLowerCase()}`);
  renderCategoryOptions();
  renderMenuItems();
}

function renderCategoryOptions() {
  const selectedMenuCategory = menuItemCategorySelect.value;
  const selectedSubcategoryCategory = subcategoryCategorySelect.value;

  subcategoryCategorySelect.innerHTML = "";
  menuItemCategorySelect.innerHTML = "";

  restaurantState.categories.forEach((category) => {
    const subcategoryOption = document.createElement("option");
    const menuOption = document.createElement("option");

    subcategoryOption.value = category.id;
    subcategoryOption.textContent = category.name;
    menuOption.value = category.id;
    menuOption.textContent = category.name;

    subcategoryCategorySelect.appendChild(subcategoryOption);
    menuItemCategorySelect.appendChild(menuOption);
  });

  if (restaurantState.categories.some((category) => category.id === selectedSubcategoryCategory)) {
    subcategoryCategorySelect.value = selectedSubcategoryCategory;
  }

  if (restaurantState.categories.some((category) => category.id === selectedMenuCategory)) {
    menuItemCategorySelect.value = selectedMenuCategory;
  }

  renderSubcategoryOptions();
}

function renderSubcategoryOptions() {
  const category = getCategoryById(menuItemCategorySelect.value) || restaurantState.categories[0];
  const selectedSubcategory = menuItemSubcategorySelect.value;

  menuItemSubcategorySelect.innerHTML = "";

  if (!category) return;

  category.subcategories.forEach((subcategory) => {
    const option = document.createElement("option");
    option.value = subcategory.id;
    option.textContent = subcategory.name;
    menuItemSubcategorySelect.appendChild(option);
  });

  if (category.subcategories.some((subcategory) => subcategory.id === selectedSubcategory)) {
    menuItemSubcategorySelect.value = selectedSubcategory;
  }
}

function renderMenuItems() {
  menuTableBody.innerHTML = "";

  const items = restaurantState.menuItems.filter((item) => {
    const matchesStatus = currentMenuFilter === "all" || item.status === currentMenuFilter;
    const matchesDay = Array.isArray(item.days) && item.days.includes(currentMenuDay);
    return matchesStatus && matchesDay;
  });

  emptyMenu.classList.toggle("hidden", items.length > 0);

  items.forEach((item) => {
    const row = document.createElement("tr");
    const statusClass = item.status === "Ativo" ? "preparing" : "delivered";
    const category = getCategoryById(item.categoryId);
    const subcategory = getSubcategoryById(category, item.subcategoryId);
    const values = [
      item.name,
      category ? category.name : "Geral",
      subcategory ? subcategory.name : "Principal",
      priceFormatter.format(item.price),
      item.status
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");

      if (index === 4) {
        const chip = document.createElement("span");
        chip.className = `status-chip ${statusClass}`;
        chip.textContent = value;
        cell.appendChild(chip);
      } else {
        cell.textContent = value;
      }

      row.appendChild(cell);
    });

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    const toggleButton = document.createElement("button");
    const removeButton = document.createElement("button");

    actions.className = "menu-actions";
    toggleButton.className = "menu-action-button";
    toggleButton.type = "button";
    toggleButton.textContent = item.status === "Ativo" ? "Pausar" : "Ativar";
    toggleButton.addEventListener("click", () => toggleMenuItem(item.id));

    removeButton.className = "menu-action-button danger";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => removeMenuItem(item.id));

    actions.append(toggleButton, removeButton);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);
    menuTableBody.appendChild(row);
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

function showMenuError(fieldName, message) {
  const field = menuForm.elements[fieldName];
  const error = document.querySelector(`[data-menu-error-for="${fieldName}"]`);

  field.classList.add("has-error");
  error.textContent = message;
}

function showCategoryError(fieldName, message) {
  const field = categoryForm.elements[fieldName];
  const error = document.querySelector(`[data-category-error-for="${fieldName}"]`);

  field.classList.add("has-error");
  error.textContent = message;
}

function showSubcategoryError(fieldName, message) {
  const field = subcategoryForm.elements[fieldName];
  const error = document.querySelector(`[data-subcategory-error-for="${fieldName}"]`);

  field.classList.add("has-error");
  error.textContent = message;
}

function clearMenuErrors() {
  menuForm.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  menuForm.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function clearCategoryErrors() {
  categoryForm.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  categoryForm.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function clearSubcategoryErrors() {
  subcategoryForm.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  subcategoryForm.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function enterDashboard() {
  const data = new FormData(form);
  const userName = String(data.get("name") || "").trim();
  const firstRestaurantName = String(data.get("restaurant") || "").trim();

  loadState(userName, currentMode === "signup" ? firstRestaurantName : "");
  loadRestaurantState(userName, currentMode === "signup" ? firstRestaurantName : "");
  authShell.classList.add("hidden");
  switchDashboard("admin");
}

function switchDashboard(target) {
  const isRestaurant = target === "restaurant";

  dashboardTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboardTarget === target);
  });

  if (isRestaurant) {
    dashboardShell.classList.add("hidden");
    restaurantDashboardShell.classList.remove("hidden");
    renderRestaurantDashboard();
    return;
  }

  dashboardShell.classList.remove("hidden");
  restaurantDashboardShell.classList.add("hidden");
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

function createMenuItem(event) {
  event.preventDefault();
  clearMenuErrors();

  const data = new FormData(menuForm);
  const name = String(data.get("menuItemName") || "").trim();
  const categoryId = String(data.get("menuItemCategory") || "");
  const subcategoryId = String(data.get("menuItemSubcategory") || "");
  const price = Number(data.get("menuItemPrice")) || 0;
  const days = data.getAll("menuDays");

  if (name.length < 2) {
    showMenuError("menuItemName", "Informe o nome do item.");
    return;
  }

  if (!categoryId) {
    showMenuError("menuItemCategory", "Crie ou selecione uma categoria.");
    return;
  }

  restaurantState.menuItems.unshift({
    id: createId("menu"),
    name,
    categoryId,
    subcategoryId,
    price,
    status: "Ativo",
    days: days.length ? days : [currentMenuDay]
  });

  saveRestaurantState();
  menuForm.reset();
  setDefaultMenuDays();
  renderRestaurantDashboard();
}

function createCategory(event) {
  event.preventDefault();
  clearCategoryErrors();

  const data = new FormData(categoryForm);
  const name = String(data.get("categoryName") || "").trim();

  if (name.length < 2) {
    showCategoryError("categoryName", "Informe o nome da categoria.");
    return;
  }

  if (restaurantState.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    showCategoryError("categoryName", "Essa categoria já existe.");
    return;
  }

  restaurantState.categories.push({
    id: createId("category"),
    name,
    subcategories: [{ id: createId("subcategory"), name: "Principal" }]
  });

  saveRestaurantState();
  categoryForm.reset();
  renderRestaurantDashboard();
}

function createSubcategory(event) {
  event.preventDefault();
  clearSubcategoryErrors();

  const data = new FormData(subcategoryForm);
  const categoryId = String(data.get("subcategoryCategory") || "");
  const name = String(data.get("subcategoryName") || "").trim();
  const category = getCategoryById(categoryId);

  if (!category) {
    showSubcategoryError("subcategoryCategory", "Selecione uma categoria.");
    return;
  }

  if (name.length < 2) {
    showSubcategoryError("subcategoryName", "Informe o nome da subcategoria.");
    return;
  }

  if (category.subcategories.some((subcategory) => subcategory.name.toLowerCase() === name.toLowerCase())) {
    showSubcategoryError("subcategoryName", "Essa subcategoria já existe.");
    return;
  }

  category.subcategories.push({ id: createId("subcategory"), name });
  saveRestaurantState();
  subcategoryForm.reset();
  renderRestaurantDashboard();
}

function addDemoMenuItems() {
  const category = restaurantState.categories[0] || findOrCreateCategory("Geral");
  const subcategory = category.subcategories[0];
  const demoItems = [
    { name: "Salada da casa", price: 26, status: "Ativo", days: ["monday", "tuesday", "wednesday"] },
    { name: "Parmegiana", price: 52, status: "Ativo", days: ["thursday", "friday"] },
    { name: "Suco natural", price: 12, status: "Pausado", days: ["saturday", "sunday"] }
  ];

  restaurantState.menuItems.unshift(...demoItems.map((item) => {
    return {
      id: createId("menu"),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      ...item
    };
  }));
  saveRestaurantState();
  renderRestaurantDashboard();
}

function setDefaultMenuDays() {
  const dayInputs = menuForm.querySelectorAll('input[name="menuDays"]');

  dayInputs.forEach((input) => {
    input.checked = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(input.value);
  });
}

function toggleMenuItem(itemId) {
  const item = restaurantState.menuItems.find((menuItem) => menuItem.id === itemId);
  if (!item) return;

  item.status = item.status === "Ativo" ? "Pausado" : "Ativo";
  saveRestaurantState();
  renderRestaurantDashboard();
}

function removeMenuItem(itemId) {
  restaurantState.menuItems = restaurantState.menuItems.filter((item) => item.id !== itemId);
  saveRestaurantState();
  renderRestaurantDashboard();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

dashboardTabs.forEach((button) => {
  button.addEventListener("click", () => switchDashboard(button.dataset.dashboardTarget));
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Ocultar" : "Mostrar";
  togglePassword.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

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
  restaurantDashboardShell.classList.add("hidden");
  authShell.classList.remove("hidden");
  form.reset();
  setMode("login");
});

menuForm.addEventListener("submit", createMenuItem);
categoryForm.addEventListener("submit", createCategory);
subcategoryForm.addEventListener("submit", createSubcategory);
menuItemCategorySelect.addEventListener("change", renderSubcategoryOptions);
seedMenuButton.addEventListener("click", addDemoMenuItems);
restaurantLogoutButton.addEventListener("click", () => {
  restaurantDashboardShell.classList.add("hidden");
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

menuFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentMenuFilter = button.dataset.menuStatus;
    menuFilterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("active", filterButton === button);
    });
    renderRestaurantDashboard();
  });
});

menuDayButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentMenuDay = button.dataset.menuDay;
    menuDayButtons.forEach((dayButton) => {
      dayButton.classList.toggle("active", dayButton === button);
    });
    renderRestaurantDashboard();
  });
});
