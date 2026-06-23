
// ====================
// SEARCH GAMES
// ====================

function searchGames() {
    let searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    let input = searchInput.value.toLowerCase();

    let games = [
        { id: "cubeworld", name: "cube world" },
        { id: "neonbattlegrounds", name: "neon battlegrounds" },
        { id: "elementalsphere", name: "elemental sphere" }
    ];

    games.forEach(game => {
        let el = document.getElementById(game.id);
        if (!el) return;

        el.style.display = game.name.includes(input) ? "block" : "none";
    });
}


// ============================
// ROBLOX-LIKE AUTH SYSTEM
// ============================

// USERS DATABASE
function getUsers() {
    return JSON.parse(localStorage.getItem("users_db")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users_db", JSON.stringify(users));
}

// CURRENT SESSION
function getCurrentUserId() {
    return localStorage.getItem("current_user");
}

function setCurrentUserId(id) {
    localStorage.setItem("current_user", id);
}

// GET CURRENT USER
function getCurrentUser() {
    let users = getUsers();
    let id = getCurrentUserId();
    return users.find(u => u.id === id);
}


// ============================
// UPDATE USER DATA
// ============================

function updateUser(updater) {
    let users = getUsers();
    let id = getCurrentUserId();

    let index = users.findIndex(u => u.id === id);
    if (index === -1) return;

    updater(users[index]);
    saveUsers(users);
}


// ============================
// TOPBAR SYSTEM
// ============================

function loadTopbar() {
    let user = getCurrentUser();

    const topAvatar = document.getElementById("topAvatar");
    const topUsername = document.getElementById("topUsername");

    if (!user) return;

    if (topAvatar) {
        topAvatar.src = user.avatar || "https://placehold.co/40x40";
    }

    if (topUsername) {
        topUsername.innerText = user.username || "Guest";
    }
}


// ============================
// SETTINGS SYSTEM
// ============================

let selectedAvatar = "";

// LOAD SETTINGS INTO INPUTS
function loadSettings() {

    let user = getCurrentUser();
    if (!user) return;

    let usernameInput = document.getElementById("usernameInput");
    let languageInput = document.getElementById("languageInput");

    if (usernameInput) usernameInput.value = user.username || "";
    if (languageInput) languageInput.value = user.language || "";

    selectedAvatar = user.avatar || "";
}

loadSettings();


// ============================
// AVATAR UPLOAD
// ============================

window.addEventListener("DOMContentLoaded", () => {

    const avatarInput = document.getElementById("avatarInput");
    const avatarPreview = document.getElementById("avatarPreview");

    if (!avatarInput || !avatarPreview) return;

    let user = getCurrentUser();
    if (user && user.avatar) {
        avatarPreview.src = user.avatar;
    }

    avatarInput.addEventListener("change", function () {

        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function () {
            avatarPreview.src = reader.result;
            selectedAvatar = reader.result;
        };

        reader.readAsDataURL(file);
    });
});


// ============================
// SAVE SETTINGS (ROBLOX STYLE)
// ============================

function saveSettings() {

    let usernameInput = document.getElementById("usernameInput");
    let languageInput = document.getElementById("languageInput");

    updateUser(user => {

        if (usernameInput) user.username = usernameInput.value;
        if (languageInput) user.language = languageInput.value;

        if (selectedAvatar) {
            user.avatar = selectedAvatar;
        }
    });

    loadTopbar();

    alert("Saved successfully!");
}


// ============================
// INIT SYSTEM
// ============================

window.addEventListener("DOMContentLoaded", () => {
    loadTopbar();
});

function requireLogin() {
    let user = getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
    }
}

// ============================
// FRIEND SYSTEM CORE (FIXED)
// ============================


// update current user
function updateCurrentUser(fn) {
    let users = getUsers();
    let current = getCurrentUserId();

    let index = users.findIndex(u => u.id === current);
    if (index === -1) return;

    fn(users[index]);
    saveUsers(users);
}

// find user by name
function findUserByName(name) {
    let users = getUsers();
    return users.find(u => u.username.toLowerCase() === name.toLowerCase());
}

// ============================
// SEND FRIEND REQUEST (FIXED)
// ============================

function sendFriendRequest(targetName) {

    let users = getUsers();
    let meId = getCurrentUserId();

    let me = users.find(u => u.id === meId);
    let target = users.find(u => u.username.toLowerCase() === targetName.toLowerCase());

    if (!me || !target) return;
    if (me.id === target.id) return;

    me.requests = me.requests || [];
    target.requests = target.requests || [];

    // check duplicate
    if (target.requests.includes(me.id)) {
        alert("Already sent request");
        return;
    }

    target.requests.push(me.id);

    saveUsers(users); // 🔥 QUAN TRỌNG NHẤT

    alert("Friend request sent!");
}

// ============================
// ACCEPT FRIEND (FIXED SYNC BOTH SIDES)
// ============================

function acceptFriend(requesterId) {

    updateCurrentUser(user => {

        user.friends = user.friends || [];
        user.requests = user.requests || [];

        if (!user.friends.includes(requesterId)) {
            user.friends.push(requesterId);
        }

        user.requests = user.requests.filter(id => id !== requesterId);
    });

    // ALSO ADD BACK FRIEND TO REQUESTER
    let users = getUsers();

    let meId = getCurrentUserId();

    let requester = users.find(u => u.id === requesterId);
    if (!requester) return;

    requester.friends = requester.friends || [];

    if (!requester.friends.includes(meId)) {
        requester.friends.push(meId);
    }

    saveUsers(users);
}

// ============================
// REMOVE FRIEND (SYNC BOTH SIDES)
// ============================

function removeFriend(friendId) {

    updateCurrentUser(user => {
        user.friends = (user.friends || []).filter(id => id !== friendId);
    });

    let users = getUsers();
    let meId = getCurrentUserId();

    let friend = users.find(u => u.id === friendId);
    if (!friend) return;

    friend.friends = (friend.friends || []).filter(id => id !== meId);

    saveUsers(users);
}

// ============================
// BLOCK USER (FIXED)
// ============================

function blockUser(targetName) {

    let users = getUsers();
    let meId = getCurrentUserId();

    let me = users.find(u => u.id === meId);
    let target = findUserByName(targetName);

    if (!me || !target) return;

    me.blocked = me.blocked || [];

    if (!me.blocked.includes(target.id)) {
        me.blocked.push(target.id);
    }

    // remove friend if exists
    me.friends = (me.friends || []).filter(id => id !== target.id);
    target.friends = (target.friends || []).filter(id => id !== me.id);

    saveUsers(users);

    alert("User blocked");
}

// ============================
// DM SYSTEM (FIXED 2-WAY SYNC)
// ============================

function sendDM(targetId, text) {

    let users = getUsers();
    let meId = getCurrentUserId();

    let me = users.find(u => u.id === meId);
    let target = users.find(u => u.id === targetId);

    if (!me || !target || !text.trim()) return;

    let key = [meId, targetId].sort().join("_");

    me.messages = me.messages || {};
    target.messages = target.messages || {};

    me.messages[key] = me.messages[key] || [];
    target.messages[key] = target.messages[key] || [];

    let msg = {
        from: meId,
        text: text,
        time: Date.now()
    };

    me.messages[key].push(msg);
    target.messages[key].push(msg);

    saveUsers(users);
}
// ============================
// CHAT SYSTEM
// ============================

let lastMessageCount = 0;
let currentFriend = null;


// GLOBAL CHAT
function switchGlobal(){

    currentFriend = null;

    let title = document.getElementById("chatTitle");

    if(title){
        title.innerText = "💬 Global Chat";
    }

    loadMessages();
}


// LOAD FRIENDS PANEL
function showDMList(){

    let box = document.getElementById("friendsList");

    if(!box) return;

    box.innerHTML = "";

    let me = getCurrentUser();

    if(!me) return;

    me.friends = me.friends || [];

    me.friends.forEach(id=>{

        let friend = getUsers().find(
            u => u.id === id
        );

        if(!friend) return;

        let avatar =
        friend.avatar ||
        "https://placehold.co/50";

        let online =
        friend.online ? "🟢 Online" : "⚫ Offline";

        box.innerHTML += `

        <div class="friend-card"
        onclick="openDM('${friend.id}')">

            <img
            class="friend-avatar"
            src="${avatar}">

            <div>

                <div class="friend-name">
                    ${friend.username}
                </div>

                <div class="last-msg">
                    ${online}
                </div>

            </div>

        </div>

        `;

    });

}


// OPEN DM
function openDM(friendId){

    currentFriend = friendId;

    let friend =
    getUsers().find(
        u=>u.id===friendId
    );

    if(friend){

        document.getElementById("chatTitle")
        .innerText =
        "💬 Chat with " + friend.username;

    }

    loadDMMessages();

}


// LOAD DM
function loadDMMessages(){

    let box =
    document.getElementById("messages");

    if(!box) return;

    box.innerHTML = "";

    if(!currentFriend) return;

    let meId =
    getCurrentUserId();

    let key =
    [meId,currentFriend]
    .sort()
    .join("_");

    let me =
    getCurrentUser();

    me.messages =
    me.messages || {};

    let list =
    me.messages[key] || [];

    list.forEach(msg=>{

        let sender =
        getUsers().find(
            u=>u.id===msg.from
        );

        if(!sender) return;

        let mine =
        msg.from===meId;

        let time =
        new Date(msg.time)
        .toLocaleTimeString([],{
            hour:'2-digit',
            minute:'2-digit'
        });

        box.innerHTML += `

<div class="${mine?"my-msg":"other-msg"}">

<div class="msg-user">
${sender.username}
</div>

<div class="msg-text">
${msg.text}
</div>

<div class="msg-time">
${time}
</div>

</div>

`;

    });

if(list.length > lastMessageCount){

    box.scrollTop = box.scrollHeight;

}

lastMessageCount = list.length;

}


// GLOBAL CHAT
function loadMessages(){

    let box =
    document.getElementById("messages");

    if(!box) return;

    box.innerHTML = "";

    let messages =
    JSON.parse(
    localStorage.getItem("chat_messages"))
    || [];

    messages.forEach(msg=>{

        let mine =
        msg.userId === getCurrentUserId();

        let sender =
        getUsers().find(
            u=>u.id===msg.userId
        );

        if(!sender) return;

        let avatar =
        sender.avatar ||
        "https://placehold.co/50";

        let time =
        new Date(msg.time)
        .toLocaleTimeString([],{
            hour:'2-digit',
            minute:'2-digit'
        });

        box.innerHTML += `

<div class="${mine?"my-msg":"other-msg"}">

<div class="msg-user">
${sender.username}
</div>

<div class="msg-text">
${msg.text}
</div>

<div class="msg-time">
${time}
</div>

</div>

`;

if(messages.length > lastMessageCount){

    box.scrollTop = box.scrollHeight;

}

lastMessageCount = messages.length;
    });

    
}


// SEND
function sendMessage(){

    let input =
    document.getElementById("chatInput");

    if(!input) return;

    let text =
    input.value.trim();

    if(!text) return;


    // DM
    if(currentFriend){

        sendDM(
            currentFriend,
            text
        );

        input.value = "";

        loadDMMessages();

        return;
    }


    // GLOBAL
    let messages =
    JSON.parse(
    localStorage.getItem(
    "chat_messages"))
    || [];

    messages.push({

        userId:
        getCurrentUserId(),

        text:text,

        time:Date.now()

    });

    localStorage.setItem(
        "chat_messages",
        JSON.stringify(messages)
    );

    input.value = "";

    loadMessages();

}


// ENTER
if(document.getElementById("chatInput")){

    document
    .getElementById("chatInput")
    .addEventListener(
    "keydown",

    function(e){

        if(e.key==="Enter"){

            sendMessage();

        }

    });

}


// AUTO REFRESH
setInterval(()=>{

    if(currentFriend){

        loadDMMessages();

    }
    else{

        loadMessages();

    }

},1000);


// INIT
showDMList();
switchGlobal();


// HTML CALL
window.switchGlobal = switchGlobal;
window.showDMList = showDMList;
window.openDM = openDM;
window.sendMessage = sendMessage;