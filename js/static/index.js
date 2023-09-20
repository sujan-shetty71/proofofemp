// const base_url = window.location.origin + window.location.pathname;
// let tempId = null; // Initialize a temporary variable to store data.id

// window.onload = () => {
//     const qrBtnEl = document.querySelector('.btn-qr');
//     const qrBtnE2 = document.querySelector('.btn-qr1');
//     const qrCodeEl = document.querySelector('#qrcode');

//     qrBtnEl.addEventListener('click', (e) => {
//         makeDisabled(qrBtnEl, false);
//         fetch(base_url + 'api/sign-in')
//             .then(r => Promise.all([Promise.resolve(r.headers.get('x-id')), r.json()]))
//             .then(([id, data]) => {
//                 console.log(data);
//                 tempId = data.id; // Store data.id in the temporary variable
//                 makeQr(qrCodeEl, data);
//                 handleDisplay(qrCodeEl, true);
//                 handleDisplay(qrBtnEl, false);
//             })
//             .catch(err => console.log(err));
//     });

//     function checkCallbackStatus() {
//         if (tempId !== null) { 
//             console.log('tempidddd',tempId);
//             fetch(base_url + 'api/callbackstatus', {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'x-id': tempId 
//                 }
//             })
//                 .then(response => response.json())
//                 .then(data => {
//                     if (data.userId) {
//                         console.log('frommmmmmmmmm', data.userId);
//                     } else {
//                         console.log('waiting');
//                         setTimeout(checkCallbackStatus, 3000); 
//                     }
//                 })
//                 .catch(err => console.log(err));
//         } else {
//             console.log('tempId is null, waiting');
//             setTimeout(checkCallbackStatus, 3000); 
//         }
//     }

//     setTimeout(checkCallbackStatus, 5000); 
// };

// function makeQr(el, data) {
//     return new QRCode(el, {
//         text: JSON.stringify(data),
//         width: 250,
//         height: 250,
//         colorDark: "#000",
//         colorLight: "#e9e9e9",
//         correctLevel: QRCode.CorrectLevel.L
//     });
// }

// function handleDisplay(el, needShow, display = 'block') {
//     el.style.display = needShow ? display : 'none';
// }

// function makeDisabled(el, disabled, cls = 'disabled') {
//     if (disabled) {
//         el.disabled = true
//         el.classList.add(cls);
//     } else {
//         el.classList.remove(cls);
//         el.disabled = false;
//     }
// }


const base_url = window.location.origin + window.location.pathname;

window.onload = () => {
    const qrBtnEl = document.querySelector('.btn-qr');
    const qrCodeEl = document.querySelector('#qrcode');

    qrBtnEl.addEventListener('click', async (e) => {
        makeDisabled(qrBtnEl, false);

        try {
            const response = await fetch(base_url + 'api/sign-in');
            const id = response.headers.get('x-id');
            const data = await response.json();

            console.log(data);

            // Store data.id in a local variable unique to this session
            const tempId = data.id;

            makeQr(qrCodeEl, data);
            handleDisplay(qrCodeEl, true);
            handleDisplay(qrBtnEl, false);

            // Use tempId as needed for this session
            checkCallbackStatus(tempId);
        } catch (err) {
            console.log(err);
        }
    });

    function checkCallbackStatus(tempId) {
        console.log('Checking status for tempId:', tempId);

        fetch(base_url + 'api/callbackstatus', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-id': tempId,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                console.log('dataaaaaa',data);
                if (data.userId) {
                    console.log('Received data for sid', tempId, 'UserId:', data.userId);
                } else {
                    console.log('Waiting for tempId', tempId);
                    setTimeout(() => checkCallbackStatus(tempId), 3000);
                }
            })
            .catch((err) => console.log(err));
    }

    function makeQr(el, data) {
        return new QRCode(el, {
            text: JSON.stringify(data),
            width: 250,
            height: 250,
            colorDark: "#000",
            colorLight: "#e9e9e9",
            correctLevel: QRCode.CorrectLevel.L
        });
    }

    function handleDisplay(el, needShow, display = 'block') {
        el.style.display = needShow ? display : 'none';
    }

    function makeDisabled(el, disabled, cls = 'disabled') {
        if (disabled) {
            el.disabled = true;
            el.classList.add(cls);
        } else {
            el.classList.remove(cls);
            el.disabled = false;
        }
    }
};


