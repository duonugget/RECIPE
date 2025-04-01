const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const signupConfirmPassword = document.getElementById('signup-confirm-password');
const loginButton = document.getElementById('login-button');
const signupButton = document.getElementById('signup-button');
const warningBox = document.getElementById('warning-box');
const closeWarningBoxButton = document.getElementById('close-warning-box');

const loadingScreen = document.getElementById("loading-screen");

signupBtn.onclick = (()=>{;
 loginForm.style.marginLeft = "-50%";
 loginText.style.marginLeft = "-50%";
});

loginBtn.onclick = (()=>{
 loginForm.style.marginLeft = "0%";
 loginText.style.marginLeft = "0%";
});
signupLink.onclick = (()=>{
 signupBtn.click();
 return false;
});

loginButton.addEventListener('click', async function(event) {
    event.preventDefault(); 
    const username = loginUsername.value;
    const password = loginPassword.value;
    try {
        // Make a POST request to the backend server
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            const userID = data.userID;
            sessionStorage.setItem('userID', userID);
            showLoadingScreen();
            const scriptResponse = await fetch('http://localhost:3000/createPersonalSuggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'applicationloading-scre/json'
                },
                body: JSON.stringify({ 'userID': userID })
            });
            if (scriptResponse.ok) {
                const scriptData = await scriptResponse.json();
                console.log('Script response:', scriptData);

                hideLoadingScreen();
                window.location.href = "../optionBox/optionBox.html";
            } else {
                hideLoadingScreen();
                console.error('Script execution failed:', scriptResponse.status);
                warningBox.style.display = 'block';
            }
            window.location.href = "../optionBox/optionBox.html";
        } else {
            // Log the error status
            warningBox.style.display = 'block';
            console.error('Login failed:', response.status);
        }
    } catch (error) {
        // Log any other errors
        console.error('Error:', error);
    }
});

closeWarningBoxButton.addEventListener('click', () => {
    warningBox.style.display = 'none';
});


signupButton.addEventListener('click', function(event) {
    event.preventDefault();
    const signupUsername = document.getElementById('signup-username').value;
    const signupPassword = document.getElementById('signup-password').value;
    const signupConfirmPassword = document.getElementById('signup-confirm-password').value;
    console.log('Signup Username:', signupUsername);
    console.log('Signup Password:', signupPassword);
    console.log('Signup Confirm Password:', signupConfirmPassword);
});

function showLoadingScreen() {
    console.log("showing loading screen")
    loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    console.log("hidding loading screen")
    loadingScreen.style.display = 'none';
}