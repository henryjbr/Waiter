const supabaseSettings = window.WAITER_SUPABASE || { url: "", anonKey: "" };
const isSupabaseReady = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
const supabaseUrl = supabaseSettings.url
  .replace(/\/$/, "")
  .replace(/\/rest\/v1$/, "")
  .replace(/\/auth\/v1$/, "");
const sessionKey = "waiter.supabase.session";

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const bootScreen = document.querySelector("#bootScreen");
const authForm = document.querySelector("#authForm");
const authTitle = document.querySelector("#authTitle");
const authSubtitle = document.querySelector("#authSubtitle");
const authSubmit = document.querySelector("#authSubmit");
const authAlert = document.querySelector("#authAlert");
const nickLabel = document.querySelector("#nickLabel");
const modeButtons = document.querySelectorAll(".mode-button");
const togglePassword = document.querySelector("#togglePassword");
const passwordInput = document.querySelector("#password");

const adminDashboard = document.querySelector("#adminDashboard");
const restaurantDashboard = document.querySelector("#restaurantDashboard");
const dashboardButtons = document.querySelectorAll("[data-dashboard]");
const logoutButtons = [document.querySelector("#logoutButton"), document.querySelector("#restaurantLogoutButton")];

const adminGreeting = document.querySelector("#adminGreeting");
const restaurantForm = document.querySelector("#restaurantForm");
const restaurantToolbar = document.querySelector("#restaurantToolbar");
const restaurantSelect = document.querySelector("#restaurantSelect");
const emptyRestaurants = document.querySelector("#emptyRestaurants");
const restaurantLoginWrap = document.querySelector("#restaurantLoginWrap");
const restaurantLoginBody = document.querySelector("#restaurantLoginBody");
const ordersHeader = document.querySelector("#ordersHeader");
const ordersTitle = document.querySelector("#ordersTitle");
const ordersTableWrap = document.querySelector("#ordersTableWrap");
const ordersBody = document.querySelector("#ordersBody");
const emptyOrders = document.querySelector("#emptyOrders");
const confirmOverlay = document.querySelector("#confirmOverlay");
const confirmMessage = document.querySelector("#confirmMessage");
const cancelDeleteButton = document.querySelector("#cancelDeleteButton");
const confirmDeleteButton = document.querySelector("#confirmDeleteButton");

const restaurantGreeting = document.querySelector("#restaurantGreeting");
const categoryForm = document.querySelector("#categoryForm");
const subcategoryForm = document.querySelector("#subcategoryForm");
const menuForm = document.querySelector("#menuForm");
const subcategoryCategory = document.querySelector("#subcategoryCategory");
const itemCategory = document.querySelector("#itemCategory");
const itemSubcategory = document.querySelector("#itemSubcategory");
const weekdayTabs = document.querySelector("#weekdayTabs");
const menuDayTitle = document.querySelector("#menuDayTitle");
const addMenuDemoButton = document.querySelector("#addMenuDemoButton");
const menuBody = document.querySelector("#menuBody");
const emptyMenu = document.querySelector("#emptyMenu");

let mode = "admin-login";
let currentUser = null;
let currentRestaurantSession = null;
let state = null;
let activeDay = "monday";
let restaurantPendingDeletionId = "";
let session = readStoredSession();

const weekdays = [
  ["monday", "Segunda"],
  ["tuesday", "Terça"],
  ["wednesday", "Quarta"],
  ["thursday", "Quinta"],
  ["friday", "Sexta"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"]
];

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function nickToEmail(nick) {
  const clean = nick
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");

  return `${clean || "user"}@waiter.internal`;
}

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey));
  } catch {
    return null;
  }
}

function storeSession(authData) {
  session = {
    access_token: authData.access_token,
    refresh_token: authData.refresh_token,
    expires_at: authData.expires_at,
    user: authData.user
  };
  currentUser = authData.user;
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

function clearStoredSession() {
  session = null;
  localStorage.removeItem(sessionKey);
}

async function requestSupabase(path, options = {}) {
  if (!isSupabaseReady) {
    throw new Error("Supabase não configurado. Preencha url e anonKey em supabase-config.js.");
  }

  const headers = {
    apikey: supabaseSettings.anonKey,
    "Content-Type": "application/json",
    ...options.headers
  };

  if (options.auth !== false && session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.msg || data?.message || data?.error_description || data?.error || "Erro ao conectar ao Supabase.");
  }

  return data;
}

async function upsertProfile(userId, nick) {
  await requestSupabase("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({ id: userId, nick })
  });
}

function createDefaultState(nick) {
  const categories = [
    {
      id: createId("category"),
      name: "Pratos",
      subcategories: [{ id: createId("subcategory"), name: "Executivos" }]
    },
    {
      id: createId("category"),
      name: "Lanches",
      subcategories: [{ id: createId("subcategory"), name: "Artesanais" }]
    }
  ];

  return {
    admin: {
      nick,
      selectedRestaurantId: "",
      restaurants: [],
      demoOrdersRemoved: true
    },
    restaurant: {
      nick,
      name: "Cardápio",
      categories,
      items: [
        {
          id: createId("item"),
          name: "Risoto de limão",
          categoryId: categories[0].id,
          subcategoryId: categories[0].subcategories[0].id,
          price: 48,
          status: "Ativo",
          days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        {
          id: createId("item"),
          name: "Burger da casa",
          categoryId: categories[1].id,
          subcategoryId: categories[1].subcategories[0].id,
          price: 32.9,
          status: "Ativo",
          days: ["friday", "saturday", "sunday"]
        }
      ]
    }
  };
}

function createRestaurantMenuState(name) {
  return {
    nick: name,
    name,
    categories: [
      {
        id: createId("category"),
        name: "Geral",
        subcategories: [{ id: createId("subcategory"), name: "Principal" }]
      }
    ],
    items: []
  };
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === "signup";
  const isRestaurant = mode === "restaurant-login";

  authForm.classList.toggle("signup", isSignup);
  authTitle.textContent = isSignup
    ? "Criar admin"
    : isRestaurant
      ? "Entrar como restaurante"
      : "Entrar como admin";
  authSubtitle.textContent = isSignup
    ? "Crie seu acesso de administrador para cadastrar restaurantes."
    : isRestaurant
      ? "Use o login e a senha criados pelo admin para acessar o cardapio."
      : "Use seu nick e senha para administrar restaurantes.";
  nickLabel.textContent = isRestaurant ? "Login do restaurante" : "Nick";
  authForm.elements.nick.placeholder = isRestaurant ? "Digite o login do restaurante" : "Digite seu nick";
  passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
  updateAuthSubmitText();

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.setAttribute("aria-selected", String(button.dataset.mode === mode));
  });

  clearAuthErrors();
}

function updateAuthSubmitText() {
  authSubmit.textContent = mode === "signup" ? "Criar admin" : "Entrar";
}

function showFieldError(scope, fieldName, message) {
  const field = scope.elements[fieldName];
  const error = document.querySelector(`[data-error-for="${fieldName}"], [data-admin-error-for="${fieldName}"], [data-category-error-for="${fieldName}"], [data-subcategory-error-for="${fieldName}"], [data-menu-error-for="${fieldName}"]`);

  if (field) field.classList.add("has-error");
  if (error) error.textContent = message;
}

function clearFormErrors(scope) {
  scope.querySelectorAll(".has-error").forEach((field) => field.classList.remove("has-error"));
  scope.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function clearAuthErrors() {
  clearFormErrors(authForm);
  authAlert.textContent = isSupabaseReady ? "" : "Supabase não configurado. Preencha url e anonKey em supabase-config.js.";
}

function validateAuth() {
  clearAuthErrors();
  const data = new FormData(authForm);
  const nick = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "").trim();
  let valid = true;

  if (nick.length < 3) {
    showFieldError(authForm, "nick", mode === "restaurant-login"
      ? "Informe o login do restaurante."
      : "Informe um nick com pelo menos 3 caracteres.");
    valid = false;
  }

  if (!password) {
    showFieldError(authForm, "password", "Informe sua senha.");
    valid = false;
  }

  return valid;
}

async function authenticate() {
  const data = new FormData(authForm);
  const nick = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "");
  const email = nickToEmail(nick);

  if (mode === "signup") {
    const authData = await requestSupabase("/auth/v1/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        email,
        password,
        data: { nick }
      })
    });

    if (!authData.user) throw new Error("Cadastro criado. Confirme o usuário no Supabase para entrar.");
    if (!authData.access_token) throw new Error("Cadastro criado. Entre novamente para iniciar a sessão.");

    storeSession(authData);
    await upsertProfile(authData.user.id, nick);
    return authData.user;
  }

  const authData = await requestSupabase("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password })
  });

  storeSession(authData);
  return authData.user;
}

async function authenticateRestaurant() {
  const data = new FormData(authForm);
  const login = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "");

  const rows = await requestSupabase("/rest/v1/rpc/login_restaurant", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_login: login,
      p_password: password
    })
  });

  const restaurant = Array.isArray(rows) ? rows[0] : rows;
  if (!restaurant?.id) {
    throw new Error("Login ou senha do restaurante incorretos.");
  }

  currentRestaurantSession = {
    id: restaurant.id,
    login: restaurant.login,
    password,
    name: restaurant.name
  };

  state = {
    admin: {
      nick: "",
      selectedRestaurantId: "",
      restaurants: []
    },
    restaurant: restaurant.menu_state || createRestaurantMenuState(restaurant.name)
  };
  state.restaurant.name = restaurant.name;
  state.restaurant.nick = restaurant.name;
  normalizeRestaurantState();
  return restaurant;
}

async function upsertRestaurantRecord(restaurant, includeMenuState = true) {
  if (!currentUser?.id) return;

  const payload = {
    id: restaurant.id,
    owner_user_id: currentUser.id,
    name: restaurant.name,
    login: restaurant.login,
    password: restaurant.password,
    orders: restaurant.orders || [],
    updated_at: new Date().toISOString()
  };

  if (includeMenuState) {
    payload.menu_state = restaurant.menuState || createRestaurantMenuState(restaurant.name);
  }

  await requestSupabase("/rest/v1/restaurants?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(payload)
  });
}

async function syncRestaurantRecords() {
  const restaurants = state.admin.restaurants.filter((restaurant) => {
    return restaurant.login && restaurant.password;
  });

  try {
    await Promise.all(restaurants.map((restaurant) => upsertRestaurantRecord(restaurant, false)));
  } catch (error) {
    console.warn("Nao foi possivel sincronizar restaurantes no Supabase.", error);
  }
}

async function deleteRestaurantRecord(restaurantId) {
  await requestSupabase(`/rest/v1/restaurants?id=eq.${encodeURIComponent(restaurantId)}`, {
    method: "DELETE"
  });
}

async function saveRestaurantWorkspace() {
  if (!currentRestaurantSession) {
    await saveState();
    return;
  }

  await requestSupabase("/rest/v1/rpc/save_restaurant_menu", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_restaurant_id: currentRestaurantSession.id,
      p_password: currentRestaurantSession.password,
      p_menu_state: state.restaurant
    })
  });
}

async function loadState(nick) {
  const rows = await requestSupabase(`/rest/v1/app_states?user_id=eq.${currentUser.id}&select=admin_state,restaurant_state`);
  const data = rows[0];

  if (data) {
    state = {
      admin: data.admin_state,
      restaurant: data.restaurant_state
    };
    normalizeState(nick);
    if (removeSavedDemoOrders()) {
      await saveState();
    }
    await syncRestaurantRecords();
    return;
  }

  state = createDefaultState(nick);
  await saveState();
  await syncRestaurantRecords();
}

function normalizeState(nick) {
  state.admin.nick = nick || state.admin.nick || "Admin";
  state.admin.restaurants = Array.isArray(state.admin.restaurants) ? state.admin.restaurants : [];
  state.admin.selectedRestaurantId = state.admin.selectedRestaurantId || state.admin.restaurants[0]?.id || "";
  state.restaurant.nick = nick || state.restaurant.nick || "Restaurante";
  normalizeRestaurantState();
}

function normalizeRestaurantState() {
  state.restaurant.categories = Array.isArray(state.restaurant.categories) && state.restaurant.categories.length
    ? state.restaurant.categories
    : [{ id: createId("category"), name: "Geral", subcategories: [{ id: createId("subcategory"), name: "Principal" }] }];
  state.restaurant.items = Array.isArray(state.restaurant.items) ? state.restaurant.items : [];

  state.restaurant.categories.forEach((category) => {
    category.subcategories = Array.isArray(category.subcategories) && category.subcategories.length
      ? category.subcategories
      : [{ id: createId("subcategory"), name: "Principal" }];
  });

  state.restaurant.items.forEach((item) => {
    item.days = Array.isArray(item.days) && item.days.length ? item.days : weekdays.map(([id]) => id);
    item.status = item.status || "Ativo";
  });
}

function removeSavedDemoOrders() {
  if (state.admin.demoOrdersRemoved) return false;

  state.admin.restaurants.forEach((restaurant) => {
    restaurant.orders = [];
  });
  state.admin.demoOrdersRemoved = true;
  return true;
}

async function saveState() {
  await requestSupabase("/rest/v1/app_states?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      user_id: currentUser.id,
      admin_state: state.admin,
      restaurant_state: state.restaurant,
      updated_at: new Date().toISOString()
    })
  });
}

async function getSessionNick(user) {
  const metadataNick = user.user_metadata?.nick;

  if (metadataNick) return metadataNick;

  const rows = await requestSupabase(`/rest/v1/profiles?id=eq.${user.id}&select=nick`);
  const data = rows[0];

  if (data?.nick) return data.nick;

  return user.email?.split("@")[0] || "Admin";
}

async function restoreSession() {
  if (!isSupabaseReady) {
    authAlert.textContent = "Supabase não configurado. Preencha url e anonKey em supabase-config.js.";
    finishBoot();
    return;
  }

  if (!session?.access_token || !session?.user) {
    finishBoot();
    return;
  }

  try {
    await refreshSession();
    const nick = await getSessionNick(currentUser);

    await loadState(nick);
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    showDashboard("admin");
    renderApp();
  } catch (restoreError) {
    authAlert.textContent = restoreError.message || "Não foi possível restaurar sua sessão.";
    authView.classList.remove("hidden");
    appView.classList.add("hidden");
  } finally {
    finishBoot();
  }
}

function finishBoot() {
  document.body.classList.remove("booting");
  bootScreen.classList.add("hidden");
}

async function refreshSession() {
  if (!session?.refresh_token) {
    currentUser = session?.user || null;
    return;
  }

  const authData = await requestSupabase("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });

  storeSession(authData);
}

function getSelectedRestaurant() {
  return state.admin.restaurants.find((restaurant) => restaurant.id === state.admin.selectedRestaurantId)
    || state.admin.restaurants[0]
    || null;
}

function getCategory(categoryId) {
  return state.restaurant.categories.find((category) => category.id === categoryId);
}

function getSubcategory(categoryId, subcategoryId) {
  return getCategory(categoryId)?.subcategories.find((subcategory) => subcategory.id === subcategoryId);
}

function renderApp() {
  renderAdmin();
  renderRestaurant();
}

function renderAdmin() {
  const selected = getSelectedRestaurant();
  const hasRestaurants = state.admin.restaurants.length > 0;

  adminGreeting.textContent = `Olá, ${state.admin.nick}`;
  restaurantSelect.innerHTML = "";
  restaurantToolbar.classList.toggle("hidden", !hasRestaurants);
  restaurantLoginWrap.classList.toggle("hidden", !hasRestaurants);
  emptyRestaurants.classList.toggle("hidden", hasRestaurants);
  ordersHeader.classList.toggle("hidden", !hasRestaurants);

  state.admin.restaurants.forEach((restaurant) => {
    const option = document.createElement("option");
    option.value = restaurant.id;
    option.textContent = restaurant.name;
    restaurantSelect.appendChild(option);
  });

  if (selected) {
    state.admin.selectedRestaurantId = selected.id;
    restaurantSelect.value = selected.id;
  }

  restaurantLoginBody.innerHTML = "";
  state.admin.restaurants.forEach((restaurant) => {
    const row = restaurantAccessRow(restaurant, selected?.id === restaurant.id);
    restaurantLoginBody.appendChild(row);
  });

  ordersBody.innerHTML = "";
  const orders = selected ? selected.orders : [];
  ordersTitle.textContent = selected ? `Pedidos de ${selected.name}` : "Pedidos";
  emptyOrders.textContent = selected ? `Nenhum pedido em ${selected.name}.` : "Nenhum pedido neste restaurante.";
  ordersTableWrap.classList.toggle("hidden", !hasRestaurants || orders.length === 0);
  emptyOrders.classList.toggle("hidden", !hasRestaurants || orders.length > 0);

  orders.forEach((order) => {
    const row = document.createElement("tr");
    row.append(
      tableCell(`#${order.id}`),
      tableCell(order.items),
      tableCell(order.status, true),
      tableCell(order.time)
    );
    ordersBody.appendChild(row);
  });
}

function restaurantAccessRow(restaurant, isSelected) {
  const row = document.createElement("div");
  const main = document.createElement("div");
  const name = document.createElement("strong");
  const credentials = document.createElement("div");
  const login = document.createElement("span");
  const password = document.createElement("span");
  const actions = document.createElement("div");
  const selectButton = document.createElement("button");
  const deleteButton = document.createElement("button");

  row.className = "restaurant-row";
  row.classList.toggle("active", isSelected);
  row.tabIndex = 0;

  main.className = "restaurant-row-main";
  name.textContent = restaurant.name;

  credentials.className = "credential-group";
  login.append("Login ", credentialText(restaurant.login || "Nao definido"));
  password.append("Senha ", credentialText(restaurant.password || "Nao definido"));
  credentials.append(login, password);

  actions.className = "restaurant-row-actions";
  selectButton.className = "secondary-button";
  selectButton.type = "button";
  selectButton.textContent = isSelected ? "Selecionado" : "Selecionar";
  selectButton.disabled = isSelected;
  selectButton.addEventListener("click", () => selectRestaurant(restaurant.id));

  deleteButton.className = "secondary-button danger-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Apagar";
  deleteButton.addEventListener("click", () => requestDeleteRestaurant(restaurant.id));

  main.append(name, credentials);
  actions.append(selectButton, deleteButton);
  row.append(main, actions);

  row.addEventListener("click", (event) => {
    if (event.target.closest("button") || isSelected) return;
    selectRestaurant(restaurant.id);
  });

  row.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !isSelected) {
      event.preventDefault();
      selectRestaurant(restaurant.id);
    }
  });

  return row;
}

function credentialText(value) {
  const text = document.createElement("span");
  text.className = "credential-text";
  text.textContent = value;
  return text;
}

async function selectRestaurant(restaurantId) {
  state.admin.selectedRestaurantId = restaurantId;
  await saveState();
  renderAdmin();
}

function renderRestaurant() {
  restaurantGreeting.textContent = state.restaurant.name;
  renderCategorySelects();
  renderWeekdayTabs();
  renderMenu();
}

function renderCategorySelects() {
  const previousItemCategory = itemCategory.value;
  const previousSubcategoryCategory = subcategoryCategory.value;

  itemCategory.innerHTML = "";
  subcategoryCategory.innerHTML = "";

  state.restaurant.categories.forEach((category) => {
    itemCategory.appendChild(option(category.id, category.name));
    subcategoryCategory.appendChild(option(category.id, category.name));
  });

  if (state.restaurant.categories.some((category) => category.id === previousItemCategory)) {
    itemCategory.value = previousItemCategory;
  }

  if (state.restaurant.categories.some((category) => category.id === previousSubcategoryCategory)) {
    subcategoryCategory.value = previousSubcategoryCategory;
  }

  renderSubcategorySelect();
}

function renderSubcategorySelect() {
  const category = getCategory(itemCategory.value) || state.restaurant.categories[0];
  const previous = itemSubcategory.value;
  itemSubcategory.innerHTML = "";

  if (!category) return;

  category.subcategories.forEach((subcategory) => {
    itemSubcategory.appendChild(option(subcategory.id, subcategory.name));
  });

  if (category.subcategories.some((subcategory) => subcategory.id === previous)) {
    itemSubcategory.value = previous;
  }
}

function renderWeekdayTabs() {
  weekdayTabs.innerHTML = "";

  weekdays.forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.classList.toggle("active", id === activeDay);
    button.textContent = label;
    button.addEventListener("click", () => {
      activeDay = id;
      renderRestaurant();
    });
    weekdayTabs.appendChild(button);
  });
}

function renderMenu() {
  const dayLabel = weekdays.find(([id]) => id === activeDay)?.[1] || "dia";
  const items = state.restaurant.items.filter((item) => item.days.includes(activeDay));
  menuDayTitle.textContent = `Cardápio de ${dayLabel.toLowerCase()}`;
  menuBody.innerHTML = "";
  emptyMenu.classList.toggle("hidden", items.length > 0);

  items.forEach((item) => {
    const category = getCategory(item.categoryId);
    const subcategory = getSubcategory(item.categoryId, item.subcategoryId);
    const row = document.createElement("tr");
    const actions = document.createElement("div");
    const toggle = document.createElement("button");
    const remove = document.createElement("button");

    actions.className = "item-actions";
    toggle.className = "action-button";
    toggle.type = "button";
    toggle.textContent = item.status === "Ativo" ? "Pausar" : "Ativar";
    toggle.addEventListener("click", () => toggleItem(item.id));

    remove.className = "action-button danger";
    remove.type = "button";
    remove.textContent = "Remover";
    remove.addEventListener("click", () => removeItem(item.id));

    actions.append(toggle, remove);

    row.append(
      tableCell(item.name),
      tableCell(category?.name || "Geral"),
      tableCell(subcategory?.name || "Principal"),
      tableCell(money.format(item.price || 0)),
      tableCell(item.status, true),
      tableCell(actions)
    );
    menuBody.appendChild(row);
  });
}

function option(value, text) {
  const item = document.createElement("option");
  item.value = value;
  item.textContent = text;
  return item;
}

function tableCell(content, status = false, codeStyle = false) {
  const cell = document.createElement("td");

  if (content instanceof HTMLElement) {
    cell.appendChild(content);
    return cell;
  }

  if (codeStyle) {
    const code = document.createElement("span");
    code.className = "credential-text";
    code.textContent = content;
    cell.appendChild(code);
    return cell;
  }

  if (status) {
    const chip = document.createElement("span");
    chip.className = `status-chip ${content === "Ativo" || content === "Preparando" ? "status-active" : "status-paused"}`;
    chip.textContent = content;
    cell.appendChild(chip);
    return cell;
  }

  cell.textContent = content;
  return cell;
}

async function createRestaurant(event) {
  event.preventDefault();
  clearFormErrors(restaurantForm);

  const data = new FormData(restaurantForm);
  const name = String(data.get("restaurantName") || "").trim();
  const login = String(data.get("restaurantLogin") || "").trim();
  const password = String(data.get("restaurantPassword") || "").trim();

  if (name.length < 2) {
    showFieldError(restaurantForm, "restaurantName", "Informe o nome do restaurante.");
    return;
  }

  if (login.length < 3) {
    showFieldError(restaurantForm, "restaurantLogin", "Informe um login com pelo menos 3 caracteres.");
    return;
  }

  if (state.admin.restaurants.some((restaurant) => restaurant.login?.toLowerCase() === login.toLowerCase())) {
    showFieldError(restaurantForm, "restaurantLogin", "Esse login já está em uso.");
    return;
  }

  if (!password) {
    showFieldError(restaurantForm, "restaurantPassword", "Informe a senha do restaurante.");
    return;
  }

  const restaurant = {
    id: createId("restaurant"),
    name,
    login,
    password,
    orders: [],
    menuState: createRestaurantMenuState(name)
  };

  try {
    await upsertRestaurantRecord(restaurant);
  } catch (error) {
    showFieldError(restaurantForm, "restaurantLogin", error.message || "Nao foi possivel salvar o login do restaurante.");
    return;
  }

  state.admin.restaurants.unshift(restaurant);
  state.admin.selectedRestaurantId = restaurant.id;
  restaurantForm.reset();
  await saveState();
  renderAdmin();
}

function requestDeleteRestaurant(restaurantId) {
  const selected = state.admin.restaurants.find((restaurant) => restaurant.id === restaurantId);
  if (!selected) return;

  restaurantPendingDeletionId = selected.id;
  confirmMessage.textContent = `Você está prestes a apagar "${selected.name}" e todos os pedidos dele.`;
  confirmOverlay.classList.remove("hidden");
  confirmDeleteButton.focus();
}

function closeDeleteConfirmation() {
  restaurantPendingDeletionId = "";
  confirmOverlay.classList.add("hidden");
}

async function confirmDeleteRestaurant() {
  if (!restaurantPendingDeletionId) return;
  const deletedRestaurantId = restaurantPendingDeletionId;

  try {
    await deleteRestaurantRecord(deletedRestaurantId);
  } catch (error) {
    confirmMessage.textContent = error.message || "Nao foi possivel apagar o restaurante no banco de dados.";
    return;
  }

  state.admin.restaurants = state.admin.restaurants.filter((restaurant) => {
    return restaurant.id !== deletedRestaurantId;
  });
  state.admin.selectedRestaurantId = state.admin.restaurants[0]?.id || "";

  closeDeleteConfirmation();
  await saveState();
  renderAdmin();
}

async function createCategory(event) {
  event.preventDefault();
  clearFormErrors(categoryForm);

  const name = String(new FormData(categoryForm).get("categoryName") || "").trim();
  if (name.length < 2) {
    showFieldError(categoryForm, "categoryName", "Informe a categoria.");
    return;
  }

  state.restaurant.categories.push({
    id: createId("category"),
    name,
    subcategories: [{ id: createId("subcategory"), name: "Principal" }]
  });
  categoryForm.reset();
  await saveRestaurantWorkspace();
  renderRestaurant();
}

async function createSubcategory(event) {
  event.preventDefault();
  clearFormErrors(subcategoryForm);

  const data = new FormData(subcategoryForm);
  const category = getCategory(String(data.get("subcategoryCategory") || ""));
  const name = String(data.get("subcategoryName") || "").trim();

  if (!category) {
    showFieldError(subcategoryForm, "subcategoryCategory", "Selecione uma categoria.");
    return;
  }

  if (name.length < 2) {
    showFieldError(subcategoryForm, "subcategoryName", "Informe a subcategoria.");
    return;
  }

  category.subcategories.push({ id: createId("subcategory"), name });
  subcategoryForm.reset();
  await saveRestaurantWorkspace();
  renderRestaurant();
}

async function createMenuItem(event) {
  event.preventDefault();
  clearFormErrors(menuForm);

  const data = new FormData(menuForm);
  const name = String(data.get("itemName") || "").trim();
  const categoryId = String(data.get("itemCategory") || "");
  const subcategoryId = String(data.get("itemSubcategory") || "");
  const price = Number(data.get("itemPrice")) || 0;
  const days = data.getAll("itemDays");

  if (name.length < 2) {
    showFieldError(menuForm, "itemName", "Informe o item.");
    return;
  }

  if (!categoryId) {
    showFieldError(menuForm, "itemCategory", "Selecione uma categoria.");
    return;
  }

  state.restaurant.items.unshift({
    id: createId("item"),
    name,
    categoryId,
    subcategoryId,
    price,
    status: "Ativo",
    days: days.length ? days : [activeDay]
  });

  menuForm.reset();
  resetDayChecks();
  await saveRestaurantWorkspace();
  renderRestaurant();
}

async function addDemoMenu() {
  const category = state.restaurant.categories[0];
  const subcategory = category.subcategories[0];

  state.restaurant.items.unshift(
    { id: createId("item"), name: "Suco natural", categoryId: category.id, subcategoryId: subcategory.id, price: 12, status: "Ativo", days: ["monday", "tuesday", "wednesday"] },
    { id: createId("item"), name: "Prato executivo", categoryId: category.id, subcategoryId: subcategory.id, price: 38, status: "Ativo", days: ["thursday", "friday"] }
  );

  await saveRestaurantWorkspace();
  renderRestaurant();
}

async function toggleItem(itemId) {
  const item = state.restaurant.items.find((entry) => entry.id === itemId);
  if (!item) return;
  item.status = item.status === "Ativo" ? "Pausado" : "Ativo";
  await saveRestaurantWorkspace();
  renderRestaurant();
}

async function removeItem(itemId) {
  state.restaurant.items = state.restaurant.items.filter((entry) => entry.id !== itemId);
  await saveRestaurantWorkspace();
  renderRestaurant();
}

function resetDayChecks() {
  menuForm.querySelectorAll('input[name="itemDays"]').forEach((input) => {
    input.checked = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(input.value);
  });
}

function showDashboard(target) {
  if (currentRestaurantSession) {
    target = "restaurant";
  }

  const showRestaurant = target === "restaurant";
  adminDashboard.classList.toggle("hidden", showRestaurant);
  restaurantDashboard.classList.toggle("hidden", !showRestaurant);

  dashboardButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboard === target);
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateAuth()) return;

  const data = new FormData(authForm);
  const nick = String(data.get("nick") || "").trim();
  authSubmit.disabled = true;
  authSubmit.textContent = "Entrando...";
  authAlert.textContent = "";

  try {
    if (mode === "restaurant-login") {
      await authenticateRestaurant();
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      showDashboard("restaurant");
      renderRestaurant();
      return;
    }

    currentRestaurantSession = null;
    currentUser = await authenticate();
    await loadState(nick);
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    showDashboard("admin");
    renderApp();
  } catch (error) {
    authAlert.textContent = error.message || "Não foi possível entrar.";
  } finally {
    authSubmit.disabled = false;
    updateAuthSubmitText();
  }
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

togglePassword.addEventListener("click", () => {
  const visible = passwordInput.type === "text";
  passwordInput.type = visible ? "password" : "text";
  togglePassword.textContent = visible ? "Mostrar" : "Ocultar";
});

dashboardButtons.forEach((button) => {
  button.addEventListener("click", () => showDashboard(button.dataset.dashboard));
});

logoutButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (isSupabaseReady && session?.access_token) {
      await requestSupabase("/auth/v1/logout", { method: "POST" }).catch(console.error);
    }

    currentUser = null;
    currentRestaurantSession = null;
    state = null;
    clearStoredSession();
    appView.classList.add("hidden");
    authView.classList.remove("hidden");
    authForm.reset();
    setMode("admin-login");
  });
});

restaurantForm.addEventListener("submit", createRestaurant);
restaurantSelect.addEventListener("change", async () => {
  await selectRestaurant(restaurantSelect.value);
});
cancelDeleteButton.addEventListener("click", closeDeleteConfirmation);
confirmDeleteButton.addEventListener("click", confirmDeleteRestaurant);
confirmOverlay.addEventListener("click", (event) => {
  if (event.target === confirmOverlay) {
    closeDeleteConfirmation();
  }
});
categoryForm.addEventListener("submit", createCategory);
subcategoryForm.addEventListener("submit", createSubcategory);
menuForm.addEventListener("submit", createMenuItem);
itemCategory.addEventListener("change", renderSubcategorySelect);
addMenuDemoButton.addEventListener("click", addDemoMenu);

restoreSession();
