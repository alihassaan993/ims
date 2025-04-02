import { styles } from '../styles/styles';
import {useState} from 'react';
import Product  from "./Product";
import { Link } from "react-router-dom";
import {Sidebar} from "./Sidebar";
import ResponsiveAppBar from './ResponsiveAppBar'

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
    return (
        <div style={styles.layout}>
            <ResponsiveAppBar setMenuItem={setMenuItem}/>
            <div style={styles.mainContent}>
                <div style={styles.container}>
                    {menuItem}
                </div>
            </div>
            <Footer />
        </div>
    );
};