import './style.css'

const API_URL = "http://localhost:3000/users/tokens";
let access_token;
let refresh_token = localStorage.getItem("refresh_token");
let resource_owner;

const signupForm = document.querySelector('#sign_up_form');
const signinForm = document.querySelector('#sign_in_form');

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#signup-email").value;
  console.log(email);
  const password = document.querySelector("#signup-password").value;
  const password_confirm = document.querySelector("#signup-password-confirm").value;

  if (password !== password_confirm) {
    alert("Passwords do not match");
    return;
  }

  const response = await fetch(`${API_URL}/sign_up`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
    headers: { "Content-Type" : "application/json" },

  });
  // tehen store the token
  await handleAuthResponse(response);
  userSession();

});

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#signin-email").value;
  const password = document.querySelector("#signin-password").value;

  const response = await fetch(`${API_URL}/sign_in`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
    headers: { "Content-Type": "application/json" },
  });
  await handleAuthResponse(response);
  userSession();
})

async function handleAuthResponse(response) {
  const data = await response.json();

  localStorage.setItem("resource_owner", JSON.stringify(data.resource_owner));
  localStorage.setItem("refresh_token", data.refresh_token);

  access_token = data.token;
  refresh_token = data.refresh_token;
  resource_owner = data.resource_owner;
}

function nullOrUndefined(itemToCheck) {
  return itemToCheck == null || itemToCheck === "undefined";
}

async function refreshToken() {
  refresh_token = localStorage.getItem("refresh_token");
  if (nullOrUndefined(refreshToken)) {
    return;
  }
  console.log(refresh_token);

  try {
    let response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refresh_token}`,
      },
    });
    if(!response.ok) {
      if(response.status === 401) {
        //handle the error
      } else {
        throw new Error(response.statusText);
      }
    }
    let data = await response.json();
    console.log("Setting access token to : ", data.token);
    localStorage.setItem("resource_owner", JSON.stringify(data.resource_owner));
    localStorage.setItem("refresh_token", data.refresh_token);

    access_token = data.token;
    refresh_token = data.refresh_token;
    resource_owner = data.resource_owner;
  } catch (err) {
    console.log("Error refreshing token: ", err);
    resetTokens();
    userSession();
  }
}

async function userSession() {
  await refreshToken();
  await requestNewAccessToken();

  if(nullOrUndefined(access_token)) {
    document.querySelector("#sign_in_form").style.display = "block";
    document.querySelector("#sign_up_form").style.display = "block";
    document.querySelector("#sign_out").style.display = "none";
  } else {
    document.querySelector("#sign_in_form").style.display = "none";
    document.querySelector("#sign_up_form").style.display = "none";
    document.querySelector("#sign_out").style.display = "block";
  }
  getUser();
}

function getUser() {
  let stored_resource = localStorage.getItem("resource_owner");
  if (nullOrUndefined(stored_resource)) {
    toggleUserDiv();
    return;
  }
  resource_owner = JSON.parse(stored_resource);
  toggleUserDiv();
}

function toggleUserDiv() {
  if(resource_owner) {
    const user = document.querySelector("#user");
    user.innerHTML = resource_owner.email;
    user.style.display = "block";
  } else {
    user.innerHTML = "";
    user.style.display = "none";
  }
}

const signoutButton = document.querySelector("#sign_out");
signoutButton.addEventListener("click", async (e) => {
  e.preventDefault();
  console.log("Loggin out");

  resetTokens();
  userSession();
});

function resetTokens() {
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("resource_owner");

  access_token = null;
  refresh_token = null;
  resource_owner = null;
}

async function  requestNewAccessToken() {
  if (nullOrUndefined(refresh_token)) {
    return;
  }
  if (access_token) {
    return;
  }

  try { 
    const response = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "appiccation/json",
        Authorization: `Bearer${refresh_token}`,
      },
    });
    handleAuthResponse(response);
  } catch (err) {
    ccnsolee.log("Errorr refreshing token: ", err);
    resetTokens();
    userSession();
  }
}

await userSession().then(() => {
  console.log(
    "%cUser session complete. Begin application logic",
    "color: green"
  );
  if (resource_owner) {
    userCanAccess();
  } else {
    console.log("No user");
  }
})

async function userCanAccess() {
  if (nullOrUndefined(access_token)) {
    return;
  }
  const response = await fetch(`http://localhost:3000/pages/restricted`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });
  const data = await response.json();

  console.log("%c" + data.message, "color: cyan");

  if(data.error) {
    console.log("Error: ", data.error);
    resetTokens();
    userSession();
  }
}