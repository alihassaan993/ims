import React, { useEffect, useState } from "react";
import {apiKey, getProductInventoryURL} from "../utils/commons";
import { styles } from "../styles/styles";

export default function ProductInventory(props) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const {productId} = props;

    useEffect(() => {
        const fetchInventory = async () => {
            try {

                const response = await fetch(
                    `${getProductInventoryURL}?productid=${productId}`,
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
                if (data && data.imsdb_invoice_item) {
                    setInventory(data.imsdb_invoice_item);
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
    }, [refresh]); // Refresh when days change

    if (loading) return <div>Loading Inventory...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridInvHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Supplier Name</div>
                    <div style={styles.gridHeaderItem}>Product Name</div>
                    <div style={styles.gridHeaderItem}>Inventory Type</div>
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
                        <div style={styles.gridCell}>{item.invoice.supplier?.supplier_name}</div>
                        <div style={styles.gridCell}>{item.product.product_name}</div>
                        <div style={styles.gridCell}>{item.invoice.invoice_type}</div>
                        <div style={styles.gridCell}>{item.quantity.toLocaleString()}</div>
                        <div style={styles.gridCell}>{item.unit_price}</div>
                        <div style={styles.gridCell}>{item.total_price.toLocaleString()}</div>
                        <div style={styles.gridCell}>{item.invoice.invoice_date}</div>
                        <div style={styles.gridCell}>{item.invoice.invoice_number}</div>
                    </div>
                ))}
            </div>
        </>
    );
}