import React, { useEffect, useState } from "react";
import { apiKey, companyID, getInventoryURL } from "../utils/commons";
import { styles } from "../styles/styles";
import { Popup } from "./Popup";
import InventoryInForm from "./InventoryInForm";
import { MenuItem, TextField } from "@mui/material";

export default function InventoryIn(props) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [daysOfTransactions, setDaysOfTransactions] = useState(30); // Default to 30 days

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                // Compute the `from_date` based on selected days
                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - daysOfTransactions);
                const formattedFromDate = fromDate.toISOString().split("T")[0]; // Convert to YYYY-MM-DD

                const response = await fetch(
                    `${getInventoryURL}?companyid=${companyID}&fromdate=${formattedFromDate}`,
                    {
                        method: "GET", // Ensure it's the correct method
                        headers: {
                            "Content-Type": "application/json",
                            "x-hasura-admin-secret": apiKey,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data  = await response.json();
                console.log("API Response:", data);

                // Ensure imsdb_inventory exists in the response
                if (data && data.imsdb_inventory) {
                    setInventory(data.imsdb_inventory);
                } else {
                    setError("Inventory data not found.");
                }

                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchInventory();
    }, [refresh, daysOfTransactions]); // Refresh when days change

    if (loading) return <div>Loading Inventory...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", marginRight: "10px" }}>
                {/* Days of Transactions Dropdown */}
                <TextField
                    fullWidth
                    select
                    label="Days of Transactions"
                    value={daysOfTransactions}
                    onChange={(e) => setDaysOfTransactions(parseInt(e.target.value))}
                    required
                    style={{ width: "30%" }}
                >
                    <MenuItem value={30}>30 Days</MenuItem>
                    <MenuItem value={60}>60 Days</MenuItem>
                    <MenuItem value={90}>90 Days</MenuItem>
                </TextField>
                <button style={styles.button} onClick={() => setOpen(true)}>Add Inventory</button>
            </div>

            <Popup openPopup={open} setOpenPopup={setOpen} title="Add Inventory">
                <InventoryInForm refresh={setRefresh} setOpenPopup={setOpen} />
            </Popup>

            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridInvHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Supplier Name</div>
                    <div style={styles.gridHeaderItem}>Product Name</div>
                    <div style={styles.gridHeaderItem}>Quantity</div>
                    <div style={styles.gridHeaderItem}>Unit Price</div>
                    <div style={styles.gridHeaderItem}>Total Amount</div>
                    <div style={styles.gridHeaderItem}>Date</div>
                    <div style={styles.gridHeaderItem}>Gate Pass</div>
                </div>

                {/* Inventory Data */}
                {inventory.map((item, index) => (
                    <div style={styles.gridInvRow} key={index}>
                        <div style={styles.gridCell}>{index + 1}</div>
                        <div style={styles.gridCell}>{item.supplier.supplier_name}</div>
                        <div style={styles.gridCell}>{item.product.product_name}</div>
                        <div style={styles.gridCell}>{item.quantity.toLocaleString()}</div>
                        <div style={styles.gridCell}>{item.unit_price}</div>
                        <div style={styles.gridCell}>{item.total_amount.toLocaleString()}</div>
                        <div style={styles.gridCell}>{item.modify_date}</div>
                        <div style={styles.gridCell}>{item.gate_pass}</div>
                    </div>
                ))}
            </div>
        </>
    );
}