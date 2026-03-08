import './NotFound404.css'

function NotFound404(){
    return(
    <div className="container_not_found">
        <h1>404</h1>
        <div class="cloak__wrapper">
            <div class="cloak__container">
                <div class="cloak"></div>
            </div>
        </div>
        <div class="info">
            <h2>Oops! We can't find that page</h2>
            <p></p><a href="/home">Go Home</a>
        </div>
    </div>
    );
}

export default NotFound404;