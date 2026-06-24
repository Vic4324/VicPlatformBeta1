import { db } from "./firebase.js";

import {
    ref,
    get,
    set,
    update,
    push,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// =====================
// CURRENT USER
// =====================

export async function getCurrentUser() {

    let currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) return null;

    let snap = await get(
        ref(db, "users/" + currentUser.username)
    );

    if (!snap.exists()) return null;

    return snap.val();
}


// =====================
// REQUIRE LOGIN
// =====================

export async function requireLogin() {

    let user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
    }

}


// =====================
// LOAD TOPBAR
// =====================

export async function loadTopbar() {

    let user = await getCurrentUser();

    if (!user) return;

    let topAvatar =
        document.getElementById("topAvatar");

    let topUsername =
        document.getElementById("topUsername");

    let topCoins =
        document.getElementById("topCoins");

    if (topAvatar) {

        topAvatar.src =
            user.avatar ||
            "https://placehold.co/40x40";

    }

    if (topUsername) {

        topUsername.innerText =
            user.username;

    }

    if (topCoins) {

        topCoins.innerText =
            "🪙 " + (user.coins || 0) + " Coins";

    }

}


// =====================
// SEARCH GAMES/USERS
// =====================

window.searchGames = function () {

    let input =
        document.getElementById("searchInput");

    if (!input) return;

    let value =
        input.value.toLowerCase();

    let games =
        document.querySelectorAll(".game");

    games.forEach(game => {

        let title =
            game.querySelector("h3");

        if (!title) return;

        let name =
            title.innerText.toLowerCase();

        game.style.display =
            name.includes(value)
            ? "block"
            : "none";

    });

};

window.searchUser = async function () {

    let name =
        document.getElementById("searchInput")
        .value.trim();

    let box =
        document.getElementById("searchResult");

    let target =
        await findUserByName(name);

    if (!target) {

        box.innerHTML =
            "<p>❌ User not found</p>";

        return;

    }

    box.innerHTML = `

<div class="item">

<div>

<b>${target.username}</b>

</div>

<button
onclick="sendFriendRequest('${target.username}')">

Add Friend

</button>

</div>

`;

}


// =====================
// LIKE GAME
// =====================

window.likeGame = async function (gameId) {

    let snap = await get(
        ref(db, "likes/" + gameId)
    );

    let likes = 0;

    if (snap.exists()) {

        likes = snap.val();

    }

    likes++;

    await set(
        ref(db, "likes/" + gameId),
        likes
    );

    loadLikes();

};


// =====================
// LOAD LIKES
// =====================

export async function loadLikes() {

    let ids = [
        "cubeworld",
        "neonbattlegrounds",
        "elementalsphere"
    ];

    for (let id of ids) {

        let element =
            document.getElementById(
                "like-" + id
            );

        if (!element) continue;

        let snap =
            await get(
                ref(db, "likes/" + id)
            );

        let likes =
            snap.exists()
            ? snap.val()
            : 0;

        element.innerText =
            "⭐ " + likes + " Likes";

    }

}


// =====================
// AUTO INIT
// =====================

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadTopbar();

        loadLikes();

    }
);

// =====================
// FIND USER BY NAME
// =====================

window.findUserByName = async function (username) {

    username = username.trim();

    let snap = await get(
        ref(db, "users/" + username)
    );

    if (!snap.exists()) return null;

    return snap.val();

};


// =====================
// SEND FRIEND REQUEST
// =====================

window.sendFriendRequest = async function (targetName) {

    let me = await getCurrentUser();

    if (!me) return;

    if (targetName === me.username) {
        alert("Cannot add yourself");
        return;
    }

    let targetSnap = await get(
        ref(db, "users/" + targetName)
    );

    if (!targetSnap.exists()) {
        alert("User not found");
        return;
    }

    let target = targetSnap.val();

    let requests = target.requests || [];

    if (requests.includes(me.username)) {
        alert("Already sent");
        return;
    }

    requests.push(me.username);

    await update(
        ref(db, "users/" + targetName),
        {
            requests: requests
        }
    );

    alert("Friend request sent!");

};

// =====================
// LOAD FRIEND LIST
// =====================

window.loadFriendList = async function(){

    let box =
    document.getElementById("friendList");

    if(!box) return;

    let me =
    await getCurrentUser();

    if(!me) return;

    box.innerHTML="";

    let friends =
    me.friends || [];

    if(friends.length===0){

        box.innerHTML =
        "<p>No friends yet</p>";

        return;

    }

let html = "";
    friends.forEach(friend=>{

        html += `

<div class="item">

<b>${friend}</b>

<button
onclick="openDM('${friend}')">

DM

</button>

<button
class="danger"
onclick="removeFriend('${friend}')">

Remove

</button>

</div>

`;

    });
    box.innerHTML = html;
}



// =====================
// ACCEPT FRIEND
// =====================

window.acceptFriend = async function (senderName) {

    let me = await getCurrentUser();

    if (!me) return;

    let myFriends = me.friends || [];
    let myRequests = me.requests || [];

    if (!myFriends.includes(senderName)) {
        myFriends.push(senderName);
    }

    myRequests = myRequests.filter(
        x => x !== senderName
    );

    await update(
        ref(db, "users/" + me.username),
        {
            friends: myFriends,
            requests: myRequests
        }
    );


    // add back
    let senderSnap = await get(
        ref(db, "users/" + senderName)
    );

    if (senderSnap.exists()) {

        let sender = senderSnap.val();

        let senderFriends =
            sender.friends || [];

        if (
            !senderFriends.includes(
                me.username
            )
        ) {

            senderFriends.push(
                me.username
            );

        }

        await update(
            ref(db, "users/" + senderName),
            {
                friends: senderFriends
            }
        );

    }

};


// =====================
// REMOVE FRIEND
// =====================

window.removeFriend = async function (friendName) {

    let me = await getCurrentUser();

    if (!me) return;

    let myFriends =
        (me.friends || [])
        .filter(
            x => x !== friendName
        );

    await update(
        ref(db, "users/" + me.username),
        {
            friends: myFriends
        }
    );


    let friendSnap = await get(
        ref(db, "users/" + friendName)
    );

    if (friendSnap.exists()) {

        let friend =
            friendSnap.val();

        let list =
            (friend.friends || [])
            .filter(
                x => x !== me.username
            );

        await update(
            ref(db, "users/" + friendName),
            {
                friends: list
            }
        );

    }

};


// =====================
// REJECT REQUEST
// =====================

window.rejectRequest = async function (senderName) {

    let me = await getCurrentUser();

    if (!me) return;

    let requests =
        (me.requests || [])
        .filter(
            x => x !== senderName
        );

    await update(
        ref(db, "users/" + me.username),
        {
            requests: requests
        }
    );

};


// =====================
// LOAD NOTIFICATIONS
// =====================

window.loadNotifications = async function () {

    let box =
        document.getElementById(
            "notificationList"
        );

    if (!box) return;

    let me =
        await getCurrentUser();

    if (!me) return;

    box.innerHTML = "";

    box.innerHTML += `
        <div class="notification">
            <h3>🎉 Welcome to Vic Platform!</h3>
            <div class="time">
                Enjoy your experience.
            </div>
        </div>
    `;

    let requests =
        me.requests || [];

    requests.forEach(sender => {

        box.innerHTML += `

<div class="notification">

<h3>
👥 ${sender} sent you a friend request
</h3>

<div class="time">
just now
</div>

<br>

<button class="accept"
onclick="acceptFriend('${sender}')">

Accept

</button>

<button class="reject"
onclick="rejectRequest('${sender}')">

Reject

</button>

</div>

`;

    });

};

// =====================
// CHAT VARIABLES
// =====================

let currentFriend = null;

// lưu listener hiện tại
let stopChatListener = null;


// =====================
// SWITCH GLOBAL CHAT
// =====================

window.switchGlobal = function () {

    currentFriend = null;

    let title =
        document.getElementById(
            "chatTitle"
        );

    if (title) {

        title.innerText =
            "💬 Global Chat";

    }

    loadMessages();

};


// =====================
// SHOW FRIEND PANEL
// =====================

window.showDMList = async function () {

    let box =
        document.getElementById(
            "friendsList"
        );

    if (!box) return;

    let me =
        await getCurrentUser();

    if (!me) return;

    box.innerHTML = "";

    let friends =
        me.friends || [];

    for (let username of friends) {

        let snap =
            await get(
                ref(db, "users/" + username)
            );

        if (!snap.exists()) continue;

        let friend =
            snap.val();

        box.innerHTML += `

<div class="friend-card"
onclick="openDM('${friend.username}')">

<img
class="friend-avatar"
src="${
friend.avatar ||
'https://placehold.co/50'
}">

<div>

<div class="friend-name">
${friend.username}
</div>

<div class="last-msg">
👤 Friend
</div>

</div>

</div>

`;

    }

};


// =====================
// OPEN DM
// =====================

window.openDM = function (username) {

    currentFriend = username;

    let title =
        document.getElementById(
            "chatTitle"
        );

    if (title) {

        title.innerText =
            "💬 Chat with " + username;

    }

    loadDMMessages();

};


// =====================
// LOAD GLOBAL CHAT
// =====================

window.loadMessages = function () {

    let box =
        document.getElementById(
            "messages"
        );

   

    if (!box) return;

    if (stopChatListener) {
    stopChatListener();
}

    stopChatListener = onValue(
        ref(db, "globalChat"),
        snapshot => {

            box.innerHTML = "";

            if (!snapshot.exists())
                return;

            snapshot.forEach(msg => {

                let data =
                    msg.val();

                    let time = new Date(data.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
});

                box.innerHTML += `

<div class="other-msg">

<div class="msg-user">
${data.username}
</div>

<div class="msg-text">
${data.text}
</div>

<div class="msg-time">
${time}
</div>

</div>

`;

            });

            box.scrollTop =
                box.scrollHeight;

        }

    

    );

};


// =====================
// LOAD DM
// =====================

window.loadDMMessages = async function () {

    let me =
        await getCurrentUser();

    if (!me || !currentFriend)
        return;

    let key =
        [me.username,
        currentFriend]
        .sort()
        .join("_");

    let box =
        document.getElementById(
            "messages"
        );

    if (!box) return;

    if (stopChatListener) {
    stopChatListener();
}

stopChatListener = onValue(
    ref(db, "dm/" + key),

        snapshot => {

            box.innerHTML = "";

            if (!snapshot.exists())
                return;

            snapshot.forEach(msg => {

                let data =
                    msg.val();

                box.innerHTML += `

<div class="${
data.username === me.username
? "my-msg"
: "other-msg"
}">

<div class="msg-user">
${data.username}
</div>

<div class="msg-text">
${data.text}
</div>

</div>

`;

            });

            box.scrollTop =
                box.scrollHeight;

        }

    );

};


// =====================
// SEND MESSAGE
// =====================

window.sendMessage = async function () {

    let input =
        document.getElementById(
            "chatInput"
        );

    if (!input) return;

    let text =
        input.value.trim();

    if (!text) return;

    let me =
        await getCurrentUser();

    if (!me) return;


    // DM
    if (currentFriend) {

        let key =
            [me.username,
            currentFriend]
            .sort()
            .join("_");

        await push(
            ref(db, "dm/" + key),
            {

                username:
                    me.username,

                text:
                    text,

                time:
                    Date.now()

            }
        );

    }

    // GLOBAL CHAT
    else {

        await push(
            ref(db, "globalChat"),
            {

                username:
                    me.username,

                text:
                    text,

                time:
                    Date.now()

            }
        );

    }

    input.value = "";

};


// =====================
// ENTER TO SEND
// =====================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        let input =
            document.getElementById(
                "chatInput"
            );

        if (!input) return;

        input.addEventListener(
            "keydown",
            e => {

                if (
                    e.key === "Enter"
                ) {

                    sendMessage();

                }

            }
        );

    }
);


// =====================
// CHAT INIT
// =====================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            document.getElementById(
                "messages"
            )
        ) {

            showDMList();

            switchGlobal();

        }

    }
);

// =====================
// LOAD PROFILE
// =====================

window.loadProfile = async function () {

    let user = await getCurrentUser();

    if (!user) return;

    let avatar =
        document.getElementById(
            "profileAvatar"
        );

    let name =
        document.getElementById(
            "profileName"
        );

    let coins =
        document.getElementById(
            "profileCoins"
        );

    let likes =
        document.getElementById(
            "profileLikes"
        );

    let games =
        document.getElementById(
            "profileGames"
        );

    let level =
        document.getElementById(
            "profileLevel"
        );

    if (avatar) {

        avatar.src =
            user.avatar ||
            "https://placehold.co/140x140";

    }

    if (name) {

        name.innerText =
            user.username;

    }

    if (coins) {

        coins.innerText =
            user.coins || 0;

    }

    let totalLikes = 0;

    if (user.likes) {

        for (let k in user.likes) {

            totalLikes += user.likes[k];

        }

    }

    if (likes) {

        likes.innerText =
            totalLikes;

    }

    let totalGames = 0;

    if (user.gamesPlayed) {

        for (let k in user.gamesPlayed) {

            totalGames += user.gamesPlayed[k];

        }

    }

    if (games) {

        games.innerText =
            totalGames;

    }

    if (level) {

        level.innerText =
            "Level " +
            (
                Math.floor(
                    (user.coins || 0) / 100
                ) + 1
            );

    }

};


// =====================
// UPDATE ONLINE STATUS
// =====================

window.updateOnlineStatus = async function () {

    let user =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );

    if (!user) return;

    await update(
        ref(
            db,
            "users/" + user.username
        ),
        {

            online: true,

            lastSeen: Date.now()

        }
    );

};


// =====================
// OFFLINE WHEN LEAVE
// =====================

window.addEventListener(
    "beforeunload",

    async () => {

        let user =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                )
            );

        if (!user) return;

        await update(
            ref(
                db,
                "users/" + user.username
            ),
            {

                online: false,

                lastSeen: Date.now()

            }
        );

    }

);


// =====================
// AUTO INIT
// =====================

window.addEventListener(
    "DOMContentLoaded",

    async () => {

        await loadTopbar();

        updateOnlineStatus();

        if (
            document.getElementById(
                "profileAvatar"
            )
        ) {

            loadProfile();

        }

        if (
            document.getElementById(
                "notificationList"
            )
        ) {

            loadNotifications();

        }

        if (
            document.getElementById(
                "friendsList"
            )
        ) {

            showDMList();

        }

        if(document.getElementById("friendList")){

    loadFriendList();

    }

        if (
            document.getElementById(
                "messages"
            )
        ) {

            switchGlobal();

        }

        if(document.getElementById("notificationList")){

    loadNotifications();

    setInterval(
        loadNotifications,
        3000
    );

        }

    }

);


// =====================
// EXPOSE FUNCTIONS
// =====================

window.requireLogin = requireLogin;
window.loadTopbar = loadTopbar;
window.loadLikes = loadLikes;
window.loadProfile = loadProfile;
window.loadFriendList = loadFriendList;