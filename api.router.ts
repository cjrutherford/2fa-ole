import {Router} from 'express';

import LocalStorage from './localStorage';
const localStorage = LocalStorage.getInstance();

const apiRouter = Router();

apiRouter.post('/register', (req,res) => {
    const {username, password} = req.body;
    console.log(req.body)
    localStorage.addUser(username, password).then(data => {
        res.send(data);
    });
});

apiRouter.post('/enable2fa', (req,res) => {
    const {username, password} = req.body;
    localStorage.enable2fa(username, password).then(data => {
        res.send(data);
    });
});

apiRouter.post('/login', (req,res) => {
    const{username, password, code = null} = req.body;
    localStorage.login(username, password, code).then(data => {
        res.send(data);
    });
});

apiRouter.post('/reset', (req,res) => {
    const {username, password, confirmPass, oldPass} = req.body;
    if(password === confirmPass){
        localStorage.resetPassword(username, oldPass, password).then(data => {
            res.send(data);
        })
    }
})


export default apiRouter;