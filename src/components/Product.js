import React, { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { Popup } from './Popup';
import ProductForm from "./ProductForm";
import ProductInventory from "./ProductInventory";
import { apiKey, getProductsURL } from "../utils/commons";
import ProductPriceChart from "./ProductPriceChart";

export default function Product() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = React.useState(false);
    const [popen, setPOpen] = React.useState(false);
    const [copen, setCOpen] = React.useState(false);
    const [productId, setProductId] = React.useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(getProductsURL, {
                    method: "GET", // or "POST" depending on your API
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                setProducts(data.imsdb_product);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) return <div>Loading Products...</div>;
    if (error) return <div>Error: {error}</div>;

    function fetchProductInventory(_productId){
        setPOpen(true);
        setProductId(_productId);
    }
    function fetchProductChart(_productId){
        setCOpen(true);
        setProductId(_productId);
    }
    return (
        <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", marginRight: "10px" }}>
                <button style={styles.button} onClick={() => setOpen(true)}>Add Product</button>
            </div>
            <Popup openPopup={open} setOpenPopup={setOpen} title="Add Product">
                <ProductForm />
            </Popup>
            <Popup openPopup={popen} setOpenPopup={setPOpen} title="Product Inventory">
                <ProductInventory productId={productId} />
            </Popup>
            <Popup openPopup={copen} setOpenPopup={setCOpen} title="Product Price Chart">
                <ProductPriceChart productId={productId} />
            </Popup>
            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Product Name</div>
                    <div style={styles.gridHeaderItem}>Total Purchased</div>
                    <div style={styles.gridHeaderItem}>Total Sold</div>
                    <div style={styles.gridHeaderItem}>Available Quantity</div>
                    <div style={styles.gridHeaderItem}>Price Chart</div>
                </div>

                {products.map((product, index) => (
                    <div style={styles.gridRow} key={index}>
                        <div style={styles.gridCell}>{index + 1}</div>
                        <div style={{
                            ...styles.gridCell,
                            color: "blue",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }} onClick={() => fetchProductInventory(product.product_id)}>{product.product_name}</div>
                            <div style={styles.gridCell}>{product.total_purchased.aggregate.sum.quantity !== null ? product.total_purchased.aggregate.sum.quantity.toLocaleString() : "-"}</div>
                            <div style={styles.gridCell}>{product.total_sold.aggregate.sum.quantity !== null ? product.total_sold.aggregate.sum.quantity.toLocaleString() : "-"}</div>
                            <div style={styles.gridCell}>{(product.total_purchased?.aggregate?.sum?.quantity??0-product.total_sold?.aggregate?.sum?.quantity??0).toLocaleString()}</div>
                        <div  style={{
                            ...styles.gridCell,
                            color: "blue",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }} onClick={() => fetchProductChart(product.product_id)}>Price Chart</div>
                    </div>
                ))}
            </div>
        </>
    );
}