const emailSpan = document.getElementById("email-info")

const [placeholder, rot13email] = document.querySelectorAll("#email-info span")

const showEmail = () => {
    placeholder.style.opacity = 0;
    setTimeout(() => {
        placeholder.style.display = "none";
        rot13email.style.display = "";
        rot13email.style.opacity = 1;
        rot13email.innerText = str_rot13(rot13email.innerText)
        emailSpan.removeEventListener("mouseenter", showEmail)

    }, 300)
}
emailSpan.addEventListener("mouseenter", showEmail);

// https://codereview.stackexchange.com/a/192241
function str_rot13(str){
    return (str+'').replace(/[a-zA-Z]/gi,function(s){
        return String.fromCharCode(s.charCodeAt(0)+(s.toLowerCase()<'n'?13:-13))
    })
}
