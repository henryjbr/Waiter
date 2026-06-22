const supabaseSettings = window.WAITER_SUPABASE || { url: "", anonKey: "" };
const isSupabaseReady = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
const supabaseUrl = supabaseSettings.url
  .replace(/\/$/, "")
  .replace(/\/rest\/v1$/, "")
  .replace(/\/auth\/v1$/, "");
const sessionKey = "waiter.supabase.session";
const restaurantSessionKey = "waiter.restaurant.session";

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const customerView = document.querySelector("#customerView");
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
const menuBody = document.querySelector("#menuBody");
const emptyMenu = document.querySelector("#emptyMenu");
const clientForm = document.querySelector("#clientForm");
const clientListBody = document.querySelector("#clientListBody");
const emptyClients = document.querySelector("#emptyClients");
const refreshRestaurantOrdersButton = document.querySelector("#refreshRestaurantOrdersButton");
const restaurantOrdersBody = document.querySelector("#restaurantOrdersBody");
const emptyRestaurantOrders = document.querySelector("#emptyRestaurantOrders");

const customerRestaurantName = document.querySelector("#customerRestaurantName");
const customerMenuSubtitle = document.querySelector("#customerMenuSubtitle");
const customerWeekdayTabs = document.querySelector("#customerWeekdayTabs");
const customerMenuBody = document.querySelector("#customerMenuBody");
const emptyCustomerMenu = document.querySelector("#emptyCustomerMenu");
const cartItems = document.querySelector("#cartItems");
const emptyCart = document.querySelector("#emptyCart");
const orderForm = document.querySelector("#orderForm");
const sendOrderButton = document.querySelector("#sendOrderButton");
const orderAlert = document.querySelector("#orderAlert");

let mode = "login";
let currentUser = null;
let currentRestaurantSession = null;
let currentCustomerSession = null;
let currentRestaurantOrders = [];
let restaurantClients = [];
let publicRestaurant = null;
let customerCart = [];
let state = null;
let activeDay = getTodayKey();
let restaurantPendingDeletionId = "";
let clientPendingDeletionId = "";
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

function getTodayKey() {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];
}

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

function readStoredRestaurantSession() {
  try {
    return JSON.parse(localStorage.getItem(restaurantSessionKey));
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

function storeRestaurantSession(credentials) {
  localStorage.setItem(restaurantSessionKey, JSON.stringify({
    login: credentials.login,
    password: credentials.password,
    savedAt: new Date().toISOString()
  }));
}

function clearStoredRestaurantSession() {
  localStorage.removeItem(restaurantSessionKey);
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
    const error = new Error(data?.msg || data?.message || data?.error_description || data?.error || "Erro ao conectar ao Supabase.");
    error.status = response.status;
    error.code = data?.code || data?.error_code || data?.error;
    throw error;
  }

  return data;
}

async function upsertProfile(userId, nick, name = "") {
  await requestSupabase("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({ id: userId, nick, name })
  });
}

function createDefaultState(nick) {
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
      categories: [],
      items: []
    }
  };
}

function createRestaurantMenuState(name) {
  return {
    nick: name,
    name,
    categories: [],
    items: []
  };
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === "signup";

  authForm.classList.toggle("signup", isSignup);
  authTitle.textContent = isSignup ? "Criar conta" : "Entrar no painel";
  authSubtitle.textContent = isSignup
    ? "Crie sua conta de administrador para cadastrar restaurantes."
    : "Use seu login e senha. O painel correto abre automaticamente.";
  nickLabel.textContent = "Login";
  authForm.elements.nick.placeholder = "Digite seu login";
  passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
  updateAuthSubmitText();

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.setAttribute("aria-selected", String(button.dataset.mode === mode));
  });

  clearAuthErrors();
}

function updateAuthSubmitText() {
  authSubmit.textContent = mode === "signup" ? "Criar conta" : "Entrar";
}

function showFieldError(scope, fieldName, message) {
  const field = scope.elements[fieldName];
  const error = document.querySelector(`[data-error-for="${fieldName}"], [data-admin-error-for="${fieldName}"], [data-category-error-for="${fieldName}"], [data-subcategory-error-for="${fieldName}"], [data-menu-error-for="${fieldName}"], [data-client-error-for="${fieldName}"], [data-order-error-for="${fieldName}"]`);

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

function isInvalidSessionError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("refresh token") || message.includes("invalid refresh");
}

function isAlreadyRegisteredError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("already registered")
    || message.includes("user already registered")
    || message.includes("already exists")
    || message.includes("already been registered");
}

function getSignupErrorMessage(error) {
  const message = String(error?.message || "").toLowerCase();

  if (isAlreadyRegisteredError(error)) {
    return "Esse login já existe. Entre com a senha correta ou use outro login.";
  }

  if (message.includes("password") && (message.includes("6") || message.includes("weak") || message.includes("short"))) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return error?.message || "Não foi possível criar a conta.";
}

function validateAuth() {
  clearAuthErrors();
  const data = new FormData(authForm);
  const name = String(data.get("fullName") || "").trim();
  const nick = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "").trim();
  let valid = true;

  if (mode === "signup" && name.length < 2) {
    showFieldError(authForm, "fullName", "Informe seu nome.");
    valid = false;
  }

  if (nick.length < 3) {
    showFieldError(authForm, "nick", "Informe um login com pelo menos 3 caracteres.");
    valid = false;
  }

  if (!password) {
    showFieldError(authForm, "password", "Informe sua senha.");
    valid = false;
  }

  if (mode === "signup" && password && password.length < 6) {
    showFieldError(authForm, "password", "A senha precisa ter pelo menos 6 caracteres.");
    valid = false;
  }

  return valid;
}

async function authenticate() {
  const data = new FormData(authForm);
  const name = String(data.get("fullName") || "").trim();
  const nick = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "");
  const email = nickToEmail(nick);

  if (mode === "signup") {
    let authData;

    try {
      authData = await requestSupabase("/auth/v1/signup", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          password,
          data: { nick, name }
        })
      });

    } catch (signupError) {
      if (!isAlreadyRegisteredError(signupError)) {
        throw new Error(getSignupErrorMessage(signupError));
      }

      try {
        authData = await requestSupabase("/auth/v1/token?grant_type=password", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password })
        });
      } catch {
        throw new Error("Esse login já existe. Entre com a senha correta ou use outro login.");
      }
    }

    if (!authData.user) throw new Error("Cadastro criado. Confirme o usuário no Supabase para entrar.");
    if (!authData.access_token) throw new Error("Cadastro criado. Entre novamente para iniciar a sessão.");

    storeSession(authData);
    await upsertProfile(authData.user.id, nick, name);
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

  return loginRestaurantWithCredentials(login, password);
}

async function loginRestaurantWithCredentials(login, password) {
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
  currentRestaurantOrders = Array.isArray(restaurant.orders) ? restaurant.orders : [];

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

async function authenticateCustomer() {
  const data = new FormData(authForm);
  const login = String(data.get("nick") || "").trim();
  const password = String(data.get("password") || "");

  const rows = await requestSupabase("/rest/v1/rpc/login_customer", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_login: login,
      p_password: password
    })
  });

  const customer = Array.isArray(rows) ? rows[0] : rows;
  if (!customer?.customer_id || !customer?.restaurant_id) {
    throw new Error("Login ou senha do cliente incorretos.");
  }

  currentCustomerSession = {
    id: customer.customer_id,
    name: customer.customer_name,
    login: customer.customer_login,
    restaurantId: customer.restaurant_id,
    restaurantName: customer.restaurant_name
  };

  publicRestaurant = {
    id: customer.restaurant_id,
    name: customer.restaurant_name,
    login: customer.restaurant_login,
    menuState: customer.menu_state || createRestaurantMenuState(customer.restaurant_name)
  };
  customerCart = [];
  activeDay = getTodayKey();
  normalizePublicRestaurantState();
  return customer;
}

async function loginAutomatically(nick) {
  try {
    currentRestaurantSession = null;
    currentCustomerSession = null;
    currentRestaurantOrders = [];
    restaurantClients = [];
    clearStoredRestaurantSession();
    currentUser = await authenticate();
    await loadState(nick);
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    showDashboard("admin");
    renderApp();
    return;
  } catch (adminError) {
    if (String(adminError?.message || "").includes("Supabase")) {
      throw adminError;
    }

    clearStoredSession();
    currentUser = null;
  }

  try {
    await authenticateRestaurant();
    currentCustomerSession = null;
    storeRestaurantSession(currentRestaurantSession);
    await refreshRestaurantClients();
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    customerView.classList.add("hidden");
    showDashboard("restaurant");
    renderRestaurant();
    return;
  } catch {
    currentRestaurantSession = null;
    currentRestaurantOrders = [];
    restaurantClients = [];
  }

  try {
    await authenticateCustomer();
    clearStoredRestaurantSession();
    authView.classList.add("hidden");
    appView.classList.add("hidden");
    customerView.classList.remove("hidden");
    renderCustomerView();
  } catch {
    throw new Error("Login ou senha incorretos.");
  }
}

async function upsertRestaurantRecord(restaurant, includeMenuState = true, includeOrders = true) {
  if (!currentUser?.id) return;

  const payload = {
    id: restaurant.id,
    owner_user_id: currentUser.id,
    name: restaurant.name,
    login: restaurant.login,
    password: restaurant.password,
    updated_at: new Date().toISOString()
  };

  if (includeOrders) {
    payload.orders = restaurant.orders || [];
  }

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
    await Promise.all(restaurants.map((restaurant) => upsertRestaurantRecord(restaurant, false, false)));
  } catch (error) {
    console.warn("Nao foi possivel sincronizar restaurantes no Supabase.", error);
  }
}

async function loadRestaurantRecords() {
  const rows = await requestSupabase(`/rest/v1/restaurants?owner_user_id=eq.${currentUser.id}&select=id,name,login,password,orders,menu_state&order=created_at.desc`);
  const known = new Map(state.admin.restaurants.map((restaurant) => [restaurant.id, restaurant]));

  rows.forEach((row) => {
    const existing = known.get(row.id);
    const record = existing || {
      id: row.id,
      name: row.name,
      login: row.login,
      password: row.password,
      orders: []
    };

    record.name = row.name || record.name;
    record.login = row.login || record.login;
    record.password = row.password || record.password;
    record.orders = Array.isArray(row.orders) ? row.orders : [];
    record.menuState = row.menu_state || record.menuState || createRestaurantMenuState(record.name);

    if (!existing) {
      state.admin.restaurants.push(record);
    }
  });

  state.admin.restaurants.forEach((restaurant) => {
    restaurant.orders = Array.isArray(restaurant.orders) ? restaurant.orders : [];
  });
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

async function refreshRestaurantOrders() {
  if (!currentRestaurantSession) return;

  const rows = await requestSupabase("/rest/v1/rpc/login_restaurant", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_login: currentRestaurantSession.login,
      p_password: currentRestaurantSession.password
    })
  });
  const restaurant = Array.isArray(rows) ? rows[0] : rows;

  currentRestaurantOrders = Array.isArray(restaurant?.orders) ? restaurant.orders : [];
  renderRestaurantOrders();
}

async function refreshRestaurantClients() {
  if (!currentRestaurantSession) return;

  const rows = await requestSupabase("/rest/v1/rpc/list_restaurant_customers", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_restaurant_id: currentRestaurantSession.id,
      p_password: currentRestaurantSession.password
    })
  });

  restaurantClients = Array.isArray(rows) ? rows : [];
  renderClients();
}

async function deleteRestaurantCustomerRecord(customerId) {
  await requestSupabase("/rest/v1/rpc/delete_restaurant_customer", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      p_restaurant_id: currentRestaurantSession.id,
      p_password: currentRestaurantSession.password,
      p_customer_id: customerId
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
    await loadRestaurantRecords();
    return;
  }

  state = createDefaultState(nick);
  await saveState();
  await syncRestaurantRecords();
  await loadRestaurantRecords();
}

function normalizeState(nick) {
  state.admin.nick = nick || state.admin.nick || "Admin";
  state.admin.restaurants = Array.isArray(state.admin.restaurants) ? state.admin.restaurants : [];
  state.admin.selectedRestaurantId = state.admin.selectedRestaurantId || state.admin.restaurants[0]?.id || "";
  state.restaurant.nick = nick || state.restaurant.nick || "Restaurante";
  normalizeRestaurantState();
}

function normalizeRestaurantState() {
  state.restaurant.categories = Array.isArray(state.restaurant.categories) ? state.restaurant.categories : [];
  state.restaurant.items = Array.isArray(state.restaurant.items) ? state.restaurant.items : [];

  removeGeneratedPlaceholderCategories(state.restaurant);

  state.restaurant.categories.forEach((category) => {
    category.subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
  });

  state.restaurant.items.forEach((item) => {
    item.days = Array.isArray(item.days) && item.days.length ? item.days : weekdays.map(([id]) => id);
    item.status = item.status || "Ativo";
  });
}

function removeGeneratedPlaceholderCategories(menuState) {
  const itemCategoryIds = new Set((menuState.items || []).map((item) => item.categoryId).filter(Boolean));

  menuState.categories = (menuState.categories || []).filter((category) => {
    const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
    const isGeneratedCategory = String(category.name || "").trim().toLowerCase() === "geral";
    const onlyGeneratedSubcategory = subcategories.length <= 1
      && String(subcategories[0]?.name || "").trim().toLowerCase() === "principal";

    return !(isGeneratedCategory && onlyGeneratedSubcategory && !itemCategoryIds.has(category.id));
  });

  menuState.categories.forEach((category) => {
    category.subcategories = (category.subcategories || []).filter((subcategory) => {
      return String(subcategory.name || "").trim().toLowerCase() !== "principal";
    });
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
  if (isPublicOrderRoute()) {
    try {
      await loadPublicCustomerMenu();
    } catch (error) {
      authView.classList.add("hidden");
      appView.classList.add("hidden");
      customerView.classList.remove("hidden");
      customerRestaurantName.textContent = "Não foi possível abrir o cardápio";
      customerMenuSubtitle.textContent = error.message || "Tente novamente em instantes.";
    } finally {
      finishBoot();
    }
    return;
  }

  if (!isSupabaseReady) {
    authAlert.textContent = "Supabase não configurado. Preencha url e anonKey em supabase-config.js.";
    finishBoot();
    return;
  }

  const storedRestaurantSession = readStoredRestaurantSession();
  if (storedRestaurantSession?.login && storedRestaurantSession?.password) {
    try {
      await loginRestaurantWithCredentials(storedRestaurantSession.login, storedRestaurantSession.password);
      await refreshRestaurantClients();
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      customerView.classList.add("hidden");
      showDashboard("restaurant");
      renderRestaurant();
      finishBoot();
      return;
    } catch {
      currentRestaurantSession = null;
      currentRestaurantOrders = [];
      restaurantClients = [];
      clearStoredRestaurantSession();
    }
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
    currentUser = null;
    currentRestaurantSession = null;
    currentCustomerSession = null;
    state = null;
    clearStoredSession();
    setMode("login");
    authForm.reset();
    if (isInvalidSessionError(restoreError)) {
      restoreError.message = "Sua sessão expirou. Entre novamente.";
    }
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

function isPublicOrderRoute() {
  return Boolean(getPublicRestaurantLogin());
}

function getPublicRestaurantLogin() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("loja") || params.get("restaurant") || "").trim();
}

function getRestaurantMenuUrl(login) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("loja", login);
  return url.toString();
}

function getPublicMenuState() {
  return publicRestaurant?.menuState || createRestaurantMenuState(publicRestaurant?.name || "Restaurante");
}

function getPublicCategory(categoryId) {
  return getPublicMenuState().categories.find((category) => category.id === categoryId);
}

function getPublicSubcategory(categoryId, subcategoryId) {
  return getPublicCategory(categoryId)?.subcategories.find((subcategory) => subcategory.id === subcategoryId);
}

async function loadPublicCustomerMenu() {
  currentCustomerSession = null;
  authView.classList.add("hidden");
  appView.classList.add("hidden");
  customerView.classList.remove("hidden");

  if (!isSupabaseReady) {
    customerMenuSubtitle.textContent = "Supabase não configurado.";
    return;
  }

  const login = getPublicRestaurantLogin();
  const rows = await requestSupabase("/rest/v1/rpc/get_public_restaurant", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ p_login: login })
  });
  const restaurant = Array.isArray(rows) ? rows[0] : rows;

  if (!restaurant?.id) {
    customerRestaurantName.textContent = "Restaurante não encontrado";
    customerMenuSubtitle.textContent = "Confira o link do cardápio.";
    customerMenuBody.innerHTML = "";
    emptyCustomerMenu.classList.remove("hidden");
    return;
  }

  publicRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    login: restaurant.login,
    menuState: restaurant.menu_state || createRestaurantMenuState(restaurant.name)
  };
  normalizePublicRestaurantState();
  renderCustomerView();
}

function normalizePublicRestaurantState() {
  const menuState = getPublicMenuState();
  menuState.categories = Array.isArray(menuState.categories) ? menuState.categories : [];
  menuState.items = Array.isArray(menuState.items) ? menuState.items : [];
  removeGeneratedPlaceholderCategories(menuState);
  menuState.categories.forEach((category) => {
    category.subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
  });
  menuState.items.forEach((item) => {
    item.days = Array.isArray(item.days) && item.days.length ? item.days : weekdays.map(([id]) => id);
    item.status = item.status || "Ativo";
  });
}

function renderCustomerView() {
  const dayLabel = weekdays.find(([id]) => id === activeDay)?.[1] || "dia";
  const isLoggedCustomer = Boolean(currentCustomerSession);

  customerRestaurantName.textContent = publicRestaurant.name;
  customerMenuSubtitle.textContent = isLoggedCustomer
    ? `Olá, ${currentCustomerSession.name}. Cardápio de hoje.`
    : `Cardápio de ${dayLabel.toLowerCase()}`;
  customerWeekdayTabs.classList.toggle("hidden", isLoggedCustomer);

  if (isLoggedCustomer && orderForm.elements.customerName) {
    orderForm.elements.customerName.value = currentCustomerSession.name || "";
  }

  renderCustomerWeekdayTabs();
  renderCustomerMenu();
  renderCart();
}

function renderCustomerWeekdayTabs() {
  customerWeekdayTabs.innerHTML = "";

  weekdays.forEach(([id, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-button";
    button.classList.toggle("active", id === activeDay);
    button.textContent = label;
    button.addEventListener("click", () => {
      activeDay = id;
      renderCustomerView();
    });
    customerWeekdayTabs.appendChild(button);
  });
}

function renderCustomerMenu() {
  const items = getPublicMenuState().items.filter((item) => {
    return item.status === "Ativo" && item.days.includes(activeDay);
  });

  customerMenuBody.innerHTML = "";
  emptyCustomerMenu.classList.toggle("hidden", items.length > 0);

  items.forEach((item) => {
    const category = getPublicCategory(item.categoryId);
    const subcategory = getPublicSubcategory(item.categoryId, item.subcategoryId);
    const row = document.createElement("article");
    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("p");
    const addButton = document.createElement("button");

    row.className = "customer-item";
    info.className = "customer-item-info";
    title.textContent = item.name;
    meta.textContent = [category?.name, subcategory?.name]
      .filter(Boolean)
      .join(" • ");

    addButton.className = "secondary-button";
    addButton.type = "button";
    addButton.textContent = "Adicionar";
    addButton.addEventListener("click", () => addToCart(item));

    info.append(title, meta);
    row.append(info, addButton);
    customerMenuBody.appendChild(row);
  });
}

function addToCart(item) {
  const existing = customerCart.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    customerCart.push({
      id: item.id,
      name: item.name,
      quantity: 1
    });
  }

  orderAlert.textContent = "";
  renderCart();
}

function changeCartQuantity(itemId, delta) {
  const item = customerCart.find((entry) => entry.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    customerCart = customerCart.filter((entry) => entry.id !== itemId);
  }

  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";
  emptyCart.classList.toggle("hidden", customerCart.length > 0);
  sendOrderButton.disabled = customerCart.length === 0;

  customerCart.forEach((item) => {
    const row = document.createElement("div");
    const main = document.createElement("div");
    const title = document.createElement("strong");
    const controls = document.createElement("div");
    const removeButton = document.createElement("button");
    const quantity = document.createElement("strong");
    const addButton = document.createElement("button");

    row.className = "cart-row";
    main.className = "cart-row-main";
    title.textContent = item.name;

    controls.className = "cart-controls";
    removeButton.className = "secondary-button";
    removeButton.type = "button";
    removeButton.textContent = "-";
    removeButton.addEventListener("click", () => changeCartQuantity(item.id, -1));

    quantity.textContent = String(item.quantity);

    addButton.className = "secondary-button";
    addButton.type = "button";
    addButton.textContent = "+";
    addButton.addEventListener("click", () => changeCartQuantity(item.id, 1));

    main.append(title);
    controls.append(removeButton, quantity, addButton);
    row.append(main, controls);
    cartItems.appendChild(row);
  });
}

async function submitCustomerOrder(event) {
  event.preventDefault();
  clearFormErrors(orderForm);
  orderAlert.textContent = "";

  if (!customerCart.length) {
    orderAlert.textContent = "Adicione pelo menos um item.";
    return;
  }

  const data = new FormData(orderForm);
  const customerName = String(data.get("customerName") || "").trim();

  if (customerName.length < 2) {
    showFieldError(orderForm, "customerName", "Informe seu nome.");
    return;
  }

  const now = new Date();
  const order = {
    id: now.getTime().toString().slice(-7),
    status: "Novo",
    customerId: currentCustomerSession?.id || "",
    customerLogin: currentCustomerSession?.login || "",
    customerName,
    customerContact: String(data.get("customerContact") || "").trim(),
    tableLabel: String(data.get("tableLabel") || "").trim(),
    notes: String(data.get("orderNotes") || "").trim(),
    items: customerCart.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity
    })),
    time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    createdAt: now.toISOString()
  };

  sendOrderButton.disabled = true;
  sendOrderButton.textContent = "Enviando...";

  try {
    await requestSupabase("/rest/v1/rpc/submit_restaurant_order", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        p_restaurant_id: publicRestaurant.id,
        p_order: order
      })
    });

    customerCart = [];
    orderForm.reset();
    orderAlert.textContent = `Pedido #${order.id} enviado.`;
    renderCart();
  } catch (error) {
    orderAlert.textContent = error.message || "Não foi possível enviar o pedido.";
  } finally {
    sendOrderButton.disabled = customerCart.length === 0;
    sendOrderButton.textContent = "Enviar pedido";
  }
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
    const cells = [
      tableCell(`#${order.id}`),
      tableCell(formatOrderItems(order)),
      tableCell(order.status, true),
      tableCell(formatOrderTime(order))
    ];

    ["Pedido", "Itens", "Status", "Hora"].forEach((label, index) => {
      cells[index].dataset.label = label;
    });

    row.append(...cells);
    ordersBody.appendChild(row);
  });
}

function formatOrderItems(order) {
  if (Array.isArray(order.items)) {
    return order.items.map((item) => {
      return `${item.quantity || 1}x ${item.name}`;
    }).join(", ");
  }

  return order.items || order.itemSummary || "Itens do pedido";
}

function formatOrderTime(order) {
  if (order.time) return order.time;
  if (!order.createdAt) return "";

  return new Date(order.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderRestaurantOrders() {
  if (!restaurantOrdersBody || !emptyRestaurantOrders) return;

  restaurantOrdersBody.innerHTML = "";
  emptyRestaurantOrders.classList.toggle("hidden", currentRestaurantOrders.length > 0);

  currentRestaurantOrders.slice().reverse().forEach((order) => {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const status = document.createElement("span");
    const main = document.createElement("div");
    const items = document.createElement("p");
    const customer = document.createElement("p");

    card.className = "order-card";
    header.className = "order-card-header";
    title.textContent = `#${order.id || "Pedido"}`;
    status.className = `status-chip ${order.status === "Novo" || order.status === "Ativo" || order.status === "Preparando" ? "status-active" : "status-paused"}`;
    status.textContent = order.status || "Novo";

    main.className = "order-card-main";
    items.textContent = formatOrderItems(order);
    customer.textContent = [order.customerName, order.tableLabel, order.customerContact, formatOrderTime(order)]
      .filter(Boolean)
      .join(" • ");
    header.append(title, status);
    main.append(items, customer);
    if (order.notes) {
      const notes = document.createElement("p");
      notes.textContent = order.notes;
      main.appendChild(notes);
    }
    card.append(header, main);
    restaurantOrdersBody.appendChild(card);
  });
}

function renderClients() {
  if (!clientListBody || !emptyClients) return;

  clientListBody.innerHTML = "";
  emptyClients.classList.toggle("hidden", restaurantClients.length > 0);
  clientListBody.classList.toggle("hidden", restaurantClients.length === 0);

  restaurantClients.forEach((client) => {
    const row = document.createElement("div");
    const main = document.createElement("div");
    const name = document.createElement("strong");
    const credentials = document.createElement("div");
    const login = document.createElement("span");
    const password = document.createElement("span");
    const actions = document.createElement("div");
    const deleteButton = document.createElement("button");

    row.className = "client-row";
    main.className = "client-row-main";
    name.textContent = client.name || "Cliente";
    credentials.className = "credential-group";
    login.append("Login ", credentialText(client.login || ""));
    password.append("Senha ", credentialText(client.password || ""));
    credentials.append(login, password);

    actions.className = "client-row-actions";
    deleteButton.className = "secondary-button danger-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Apagar";
    deleteButton.addEventListener("click", () => requestDeleteClient(client.id));

    main.append(name, credentials);
    actions.appendChild(deleteButton);
    row.append(main, actions);
    clientListBody.appendChild(row);
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
  const menuLink = document.createElement("a");
  const copyLinkButton = document.createElement("button");
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
  menuLink.className = "secondary-button link-button";
  menuLink.href = getRestaurantMenuUrl(restaurant.login || "");
  menuLink.target = "_blank";
  menuLink.rel = "noreferrer";
  menuLink.textContent = "Cardápio";

  copyLinkButton.className = "secondary-button";
  copyLinkButton.type = "button";
  copyLinkButton.textContent = "Copiar link";
  copyLinkButton.addEventListener("click", async () => {
    await copyRestaurantLink(restaurant.login || "");
    copyLinkButton.textContent = "Copiado";
    window.setTimeout(() => {
      copyLinkButton.textContent = "Copiar link";
    }, 1600);
  });

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
  actions.append(menuLink, copyLinkButton, selectButton, deleteButton);
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

async function copyRestaurantLink(login) {
  const link = getRestaurantMenuUrl(login);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(link);
      return;
    } catch {
      // Falls back to the prompt below when clipboard permission is unavailable.
    }
  }

  window.prompt("Link do cardápio", link);
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
  renderClients();
  renderCategorySelects();
  renderWeekdayTabs();
  renderMenu();
}

function renderCategorySelects() {
  const previousItemCategory = itemCategory.value;
  const previousSubcategoryCategory = subcategoryCategory.value;

  itemCategory.innerHTML = "";
  subcategoryCategory.innerHTML = "";

  if (!state.restaurant.categories.length) {
    itemCategory.appendChild(option("", "Crie uma categoria"));
    subcategoryCategory.appendChild(option("", "Crie uma categoria"));
    renderSubcategorySelect();
    return;
  }

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

  if (!category) {
    itemSubcategory.appendChild(option("", "Sem subcategoria"));
    return;
  }

  itemSubcategory.appendChild(option("", "Sem subcategoria"));

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
  const menuTableWrap = menuBody.closest(".table-wrap");
  menuDayTitle.textContent = `Cardápio de ${dayLabel.toLowerCase()}`;
  menuBody.innerHTML = "";
  emptyMenu.classList.toggle("hidden", items.length > 0);
  if (menuTableWrap) {
    menuTableWrap.classList.toggle("hidden", items.length === 0);
  }

  items.forEach((item) => {
    const category = getCategory(item.categoryId);
    const subcategory = getSubcategory(item.categoryId, item.subcategoryId);
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const card = document.createElement("div");
    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("div");
    const actions = document.createElement("div");
    const toggle = document.createElement("button");
    const remove = document.createElement("button");

    row.className = "menu-card-row";
    cell.colSpan = 5;
    card.className = "menu-card";
    info.className = "menu-card-info";
    title.textContent = item.name;
    meta.className = "menu-card-meta";
    meta.append(
      menuMeta(category?.name || "Sem categoria"),
      menuMeta(subcategory?.name || "Sem subcategoria"),
      menuMeta(item.status)
    );

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
    info.append(title, meta);
    card.append(info, actions);
    cell.appendChild(card);
    row.appendChild(cell);
    menuBody.appendChild(row);
  });
}

function menuMeta(text) {
  const item = document.createElement("span");
  item.textContent = text;
  return item;
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
    chip.className = `status-chip ${content === "Ativo" || content === "Novo" || content === "Preparando" ? "status-active" : "status-paused"}`;
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

  clientPendingDeletionId = "";
  restaurantPendingDeletionId = selected.id;
  confirmMessage.textContent = `Você está prestes a apagar "${selected.name}" e todos os pedidos dele.`;
  confirmOverlay.classList.remove("hidden");
  confirmDeleteButton.focus();
}

function requestDeleteClient(clientId) {
  const selected = restaurantClients.find((client) => client.id === clientId);
  if (!selected) return;

  restaurantPendingDeletionId = "";
  clientPendingDeletionId = selected.id;
  confirmMessage.textContent = `Você está prestes a apagar o cliente "${selected.name || selected.login}".`;
  confirmOverlay.classList.remove("hidden");
  confirmDeleteButton.focus();
}

function closeDeleteConfirmation() {
  restaurantPendingDeletionId = "";
  clientPendingDeletionId = "";
  confirmOverlay.classList.add("hidden");
}

async function confirmDeleteRestaurant() {
  if (clientPendingDeletionId) {
    await confirmDeleteClient();
    return;
  }

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

async function confirmDeleteClient() {
  if (!clientPendingDeletionId) return;
  const deletedClientId = clientPendingDeletionId;

  try {
    await deleteRestaurantCustomerRecord(deletedClientId);
  } catch (error) {
    confirmMessage.textContent = error.message || "Não foi possível apagar o cliente.";
    return;
  }

  restaurantClients = restaurantClients.filter((client) => client.id !== deletedClientId);
  closeDeleteConfirmation();
  renderClients();
}

async function createClient(event) {
  event.preventDefault();
  clearFormErrors(clientForm);

  const data = new FormData(clientForm);
  const name = String(data.get("clientName") || "").trim();
  const login = String(data.get("clientLogin") || "").trim();
  const password = String(data.get("clientPassword") || "").trim();

  if (name.length < 2) {
    showFieldError(clientForm, "clientName", "Informe o nome do cliente.");
    return;
  }

  if (login.length < 3) {
    showFieldError(clientForm, "clientLogin", "Informe um login com pelo menos 3 caracteres.");
    return;
  }

  if (!password) {
    showFieldError(clientForm, "clientPassword", "Informe a senha do cliente.");
    return;
  }

  try {
    const rows = await requestSupabase("/rest/v1/rpc/create_restaurant_customer", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        p_restaurant_id: currentRestaurantSession.id,
        p_restaurant_password: currentRestaurantSession.password,
        p_name: name,
        p_login: login,
        p_password: password
      })
    });

    const customer = Array.isArray(rows) ? rows[0] : rows;
    restaurantClients.unshift(customer || { name, login, password });
    clientForm.reset();
    renderClients();
  } catch (error) {
    const message = String(error?.message || "");
    showFieldError(
      clientForm,
      "clientLogin",
      message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")
        ? "Esse login já está em uso."
        : message || "Não foi possível criar o cliente."
    );
  }
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
    subcategories: []
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
    status: "Ativo",
    days: days.length ? days : [activeDay]
  });

  menuForm.reset();
  resetDayChecks();
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
    input.checked = false;
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
    if (mode === "signup") {
      currentRestaurantSession = null;
      currentRestaurantOrders = [];
      currentUser = await authenticate();
      await loadState(nick);
      authView.classList.add("hidden");
      appView.classList.remove("hidden");
      showDashboard("admin");
      renderApp();
      return;
    }

    await loginAutomatically(nick);
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
    currentRestaurantOrders = [];
    currentCustomerSession = null;
    restaurantClients = [];
    state = null;
    clearStoredSession();
    clearStoredRestaurantSession();
    appView.classList.add("hidden");
    customerView.classList.add("hidden");
    authView.classList.remove("hidden");
    authForm.reset();
    setMode("login");
  });
});

restaurantForm.addEventListener("submit", createRestaurant);
restaurantSelect.addEventListener("change", async () => {
  await selectRestaurant(restaurantSelect.value);
});
if (clientForm) {
  clientForm.addEventListener("submit", createClient);
}
if (orderForm) {
  orderForm.addEventListener("submit", submitCustomerOrder);
}
if (refreshRestaurantOrdersButton) {
  refreshRestaurantOrdersButton.addEventListener("click", async () => {
    refreshRestaurantOrdersButton.disabled = true;
    refreshRestaurantOrdersButton.textContent = "Atualizando...";
    try {
      await refreshRestaurantOrders();
    } finally {
      refreshRestaurantOrdersButton.disabled = false;
      refreshRestaurantOrdersButton.textContent = "Atualizar";
    }
  });
}
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

restoreSession();
