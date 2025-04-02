import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Dashboard, LocalMall, ImportExport, ExitToApp, AccountBalance, Menu } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material"; // MUI components
import "../styles/sidebar.css";
import Product from "./Product";
import Supplier from "./Supplier";
import Invoices from "./Invoices";
import Customer from "./Customer";
import InvoiceOutList from "./InvoiceOutList";

export function Sidebar({ setMenuItem }) {
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`sidebar-container ${isOpen ? "open" : "closed"}`}>
            {/* Sidebar Toggle Button */}
            <div className="sidebar-header">
                <IconButton onClick={toggleSidebar} className="toggle-btn">
                    <Menu />
                </IconButton>
            </div>

            {/* Sidebar Menu */}
            <div className="sidebar-menu">
                <ul>
                    <li>
                        <Tooltip title="Products" placement="right" disableHoverListener={isOpen}>
                            <Link to="/home" onClick={() => setMenuItem(<Product />)}>
                                <Dashboard />
                                {isOpen && <span>Products</span>}
                            </Link>
                        </Tooltip>
                    </li>
                    <li>
                        <Tooltip title="Supplier" placement="right" disableHoverListener={isOpen}>
                            <Link to="/supplier" onClick={() => setMenuItem(<Supplier />)}>
                                <LocalMall />
                                {isOpen && <span>Supplier</span>}
                            </Link>
                        </Tooltip>
                    </li>
                    <li>
                        <Tooltip title="Inventory In" placement="right" disableHoverListener={isOpen}>
                            <Link to="/inventory-in" onClick={() => setMenuItem(<Invoices />)}>
                                <ImportExport />
                                {isOpen && <span>Inventory In</span>}
                            </Link>
                        </Tooltip>
                    </li>
                    <li>
                        <Tooltip title="Inventory Out" placement="right" disableHoverListener={isOpen}>
                            <Link to="/inventory-out" onClick={() => setMenuItem(<InvoiceOutList />)}>
                                <ExitToApp />
                                {isOpen && <span>Inventory Out</span>}
                            </Link>
                        </Tooltip>
                    </li>
                    <li>
                        <Tooltip title="Pool Account" placement="right" disableHoverListener={isOpen}>
                            <Link to="/inventory-in" onClick={() => setMenuItem(<Customer />)}>
                                <AccountBalance />
                                {isOpen && <span>Customer</span>}
                            </Link>
                        </Tooltip>
                    </li>
                </ul>
            </div>
        </div>
    );
}