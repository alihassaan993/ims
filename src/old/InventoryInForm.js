import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button, Box , Grid} from "@mui/material";
import {addInventoryURL, apiKey, companyID, getProductsURL, getSuppliersURL} from "../utils/commons";

export default function InventoryInForm() {
    const [formData, setFormData] = useState({
        productId: "",
        supplierId: "",
        quantity: "",
        unitPrice: "",
        totalAmount: "",
        gatePass:"",
        modifyDate: new Date().toISOString().split("T")[0], // Default to today
    });
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [error, setError] = useState(null);

    // Update total amount when quantity or unit price changes
    useEffect(() => {
        const { quantity, unitPrice } = formData;
        if (quantity && unitPrice) {
            setFormData((prev) => ({
                ...prev,
                totalAmount: quantity * unitPrice,
            }));
        }
    }, [formData.quantity, formData.unitPrice]);

    // Fetching Products
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
            } catch (error) {
                setError(error.message);
            }
        };

        fetchProducts();
    }, []);
    //////////////

    // Fetching Suppliers
    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await fetch(getSuppliersURL, {
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
                setSuppliers(data.imsdb_supplier);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchSupplier();
    }, []);
    //////////////////

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const response = await fetch(addInventoryURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': apiKey, // Add your API key here
                },
                body: JSON.stringify({
                    productId: formData.productId,
                    supplierId: formData.supplierId,
                    quantity: formData.quantity,
                    unitPrice: formData.unitPrice,
                    totalAmount:formData.totalAmount,
                    modifyDate:formData.modifyDate,
                    inventoryType:'IN',
                    companyId:companyID,
                    gatePass:formData.gatePass
                }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Product added successfully:', data);
                setFormData([]);

            } else {
                alert("Supplier Name already exists!");
                console.error('Error adding supplier:', data);
            }
        } catch (error) {
            console.error('Network error:', error);
        }

        // onSubmit(formData); // Pass data to parent
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
            <Grid container spacing={2}>
                {/* Product & Supplier in one row */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        select
                        label="Product"
                        name="productId"
                        value={formData.productId}
                        onChange={handleChange}
                        required
                    >
                        {products.map((product) => (
                            <MenuItem key={product.product_id} value={product.product_id}>
                                {product.product_name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        select
                        label="Supplier"
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        required
                    >
                        {suppliers.map((supplier) => (
                            <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                                {supplier.supplier_name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* Quantity & Unit Price in one row */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        required
                    />
                </Grid>

                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        name="unitPrice"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        required
                    />
                </Grid>

                {/* Total Amount (Read-Only) */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Total Amount"
                        type="number"
                        name="totalAmount"
                        value={formData.totalAmount}
                        InputProps={{ readOnly: true }}
                    />
                </Grid>

                {/* Date Picker */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Date"
                        type="date"
                        name="modifyDate"
                        value={formData.modifyDate}
                        onChange={handleChange}
                        required
                    />
                </Grid>

                {/* Date Picker */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Gate Pass"
                        type="text"
                        name="gatePass"
                        value={formData.gatePass}
                        onChange={handleChange}
                        required
                    />
                </Grid>
                {/* Buttons */}
                <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Button variant="contained" color="primary" type="submit">
                        Submit
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => setFormData({})}>
                        Clear
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}