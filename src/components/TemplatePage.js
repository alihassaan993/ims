import { styles } from '../styles/styles';
import React, {useEffect, useState} from 'react';
import Product  from "./Product";
import { Link } from "react-router-dom";
import {Sidebar} from "./Sidebar";
import ResponsiveAppBar from './ResponsiveAppBar'
import {Box, Button, Grid, TextField} from "@mui/material";
import {Login} from "@mui/icons-material";
import {apiKey, graphql} from "../utils/commons";

// Header Component
const Header = () => {
    return (
        <header style={styles.header}>
            <h2>Inventory Management System</h2>
        </header>
    );
};


// Footer Component
const Footer = () => {
    return (
        <footer style={styles.footer}>
            <p>© 2025 My Website. All rights reserved.</p>
        </footer>
    );
};

// Main Template Component
export function TemplatePage  ({ children })  {
    const [menuItem,setMenuItem]=useState(<Product/>);
    const [userName,setUserName]=useState("");
    const [password,setPassword]=useState("");
    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("userId")) || null
    );
    const [isLogin,setIsLogin]=useState(false);

    useEffect(() => {
        if(user!=null){
            setIsLogin(true);
        }else{
            setIsLogin(false);
        }
    },[user]);

    async function  handleLogin () {

        // Verify User //

        let loginResponse = await fetch(graphql, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
            body: JSON.stringify({
                query: `query GetUser ($userName:String!, $password:String!) {
                  imsdb_user(where: {user_name: {_eq: $userName}, password: {_eq: $password}}) {
                    user_id
                    user_full_name
                    user_name
                  }
                }`,
                variables: { userName: userName, password:password},
            }),
        });
        let userData = await loginResponse.json();

        if(userData.data.imsdb_user[0]){
            console.log(JSON.stringify(userData.data.imsdb_user[0]));
            setUser(userData.data.imsdb_user[0]);
            localStorage.setItem("userId",userData.data.imsdb_user[0].user_id);
            localStorage.setItem("fullName",userData.data.imsdb_user[0].user_full_name);
        }else{
            console.log(JSON.stringify(userData));
            alert("Login Failed. Please enter correct username and password.");
        }

        ////////////////




    }

    return (
        <div style={styles.layout}>
            {isLogin ? (
                <>
                    <ResponsiveAppBar setMenuItem={setMenuItem} setUser={setUser}/>
                    <div style={styles.mainContent}>
                        <div style={styles.container}>{menuItem}</div>
                    </div>
                    <Footer/>
                </>
            ) : (
                <>
                    <Header />
                    <div style={styles.mainContent}>
                        <div style={styles.container}>
                            <Box component="form" onSubmit={handleLogin} sx={{p: 3, maxWidth: 800, mx: "auto"}}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="User Name" value={userName} name="userName" required
                                                   onChange={(e) => setUserName(e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth type="password" value={password} label="Password"
                                                   name="password" required
                                                   onChange={(e) => setPassword(e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button variant="contained" color="secondary" startIcon={<Login/>}
                                                onClick={handleLogin}>
                                            Login
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        </div>
                        </div>
                        <Footer/>
                    </>

                    )}
                </div>
    );
};