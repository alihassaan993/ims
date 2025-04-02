
import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button, Box, Grid, IconButton } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { graphql, apiKey, companyID, getProductsURL, getSuppliersURL,INVENTORY_ACCOUNT_ID } from "../utils/commons";

export default function InvoiceForm(props){
    const {setRefresh, setOpen} = props;
    const [formData, setFormData] = useState({
        gatePass: "",
        modifyDate: new Date().toISOString().split("T")[0],
        supplierId: "",
        products: [{ productId: "", quantity: "", unitPrice: "", totalAmount: "" }],
    });
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(getProductsURL, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();
                setProducts(data.imsdb_product);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch(getSuppliersURL, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();
                setSuppliers(data.imsdb_supplier);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchSuppliers();
    }, []);


    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        const updatedProducts = [...formData.products];
        updatedProducts[index][name] = value;
        if (updatedProducts[index].quantity && updatedProducts[index].unitPrice) {
            updatedProducts[index].totalAmount = updatedProducts[index].quantity * updatedProducts[index].unitPrice;
        }
        setFormData({ ...formData, products: updatedProducts });
    };

    const addProductRow = () => {
        setFormData({
            ...formData,
            products: [...formData.products, { productId: "", quantity: "", unitPrice: "", totalAmount: "" }],
        });
    };

    const removeProductRow = (index) => {
        const updatedProducts = [...formData.products];
        updatedProducts.splice(index, 1);
        setFormData({ ...formData, products: updatedProducts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let totalAmount = 0;
            formData.products.forEach((item) => {
                totalAmount += item.totalAmount;
            })

            //  Fetching Account ID
            let accountResponse = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query: `query getAccountId($supplierId: Int!,$inventoryAccountId:Int!) {
                          imsdb_account(
                            where: {
                              _or: [
                                { supplier_id: { _eq: $supplierId } }
                                { account_id: { _eq: $inventoryAccountId } }
                              ]
                            }
                          ) {
                            supplier_id
                            account_id
                            balance
                          }
                    }`,
                    variables: {
                        supplierId: formData.supplierId,
                        inventoryAccountId:INVENTORY_ACCOUNT_ID
                    },
                }),
            });
            let accountData = await accountResponse.json();

            console.log(JSON.stringify(accountData));

            let supplierBalance = accountData.data.imsdb_account.find(acc => acc.supplier_id === formData.supplierId).balance + totalAmount;
            let accountId = accountData.data.imsdb_account.find(acc => acc.supplier_id === formData.supplierId).account_id;

            let inventoryBalance = accountData.data.imsdb_account.find(acc => acc.account_id === INVENTORY_ACCOUNT_ID).balance + totalAmount;

            //let accountId = accountData.data.imsdb_account[0]?.account_id;

            //let supplierBalance = accountData.data.imsdb_account[0]?.balance + totalAmount;
            //////////////////////

            if (!accountId) {
                alert("No account found for this supplier.");
                return;
            }
            const transactionReference = `TXN-${Date.now()}`;

            const response = await fetch(graphql, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": apiKey
                },
                body: JSON.stringify({
                    query: `mutation addInvoice(
                              $supplierId: Int!,
                              $totalAmount: Int!,
                              $invoiceDate: date!,
                              $invoiceNumber: String!,
                              $companyId: Int!,
                              $status: String!,
                              $invoiceItems: [imsdb_invoice_item_insert_input!]!,
                              $accountId: Int!,
                              $supplierBalance: Int!,
                              $transactionReference:String!,
                              $inventoryAccountId:Int!,
                              $inventoryBalance:Int!
                            ) {
                              # Insert the invoice along with invoice items and account transaction
                              insert_imsdb_invoice_one(
                                object: {
                                  supplier_id: $supplierId,
                                  company_id: $companyId,
                                  invoice_number: $invoiceNumber,
                                  total_amount: $totalAmount,
                                  invoice_date: $invoiceDate,
                                  status: $status,
                                  invoice_items: { data: $invoiceItems },
                                  account_transactions: {  # Nested insert
                                    data: [
                                      {
                                        account_id: $accountId,
                                        transaction_type: "CREDIT",
                                        amount: $totalAmount,
                                        transaction_date: $invoiceDate,
                                        transaction_reference:$transactionReference
                                      },
                                      {
                                        account_id: $inventoryAccountId,
                                        transaction_type: "DEBIT",
                                        amount: $totalAmount,
                                        transaction_date: $invoiceDate,
                                        transaction_reference:$transactionReference
                                      }
                                    ]
                                  }
                                }
                              ) {
                                invoice_id
                                invoice_number
                                total_amount
                                invoice_date
                                status
                                invoice_items {
                                  invoice_item_id
                                  product_id
                                  unit_price
                                  quantity
                                  total_price
                                }
                              }
                            
 
                              update_supplier_account: update_imsdb_account_by_pk(
                                pk_columns: { account_id: $accountId },
                                _set: { balance: $supplierBalance }
                              ) {
                                account_id
                                balance
                              }
                              
                              update_inventory_account: update_imsdb_account_by_pk(
                                pk_columns: { account_id: $inventoryAccountId },
                                _set: { balance: $inventoryBalance }
                              ) {
                                account_id
                                balance
                              }
                              
                            }`,
                    variables: {
                        supplierId: formData.supplierId,
                        companyId: companyID,
                        invoiceNumber:formData.gatePass,
                        totalAmount: formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0),
                        invoiceDate: formData.modifyDate,
                        status: "Pending",
                        invoiceItems: formData.products.map(item => ({
                            product_id: Number(item.productId),
                            unit_price: Number(item.unitPrice),
                            quantity: Number(item.quantity),
                            total_price: Number(item.totalAmount),
                        })),
                        accountId: accountId,
                        supplierBalance: supplierBalance,
                        transactionReference:transactionReference,
                        inventoryAccountId:INVENTORY_ACCOUNT_ID,
                        inventoryBalance:inventoryBalance
                    }
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Invoice Added Successfully!");
                setRefresh(true);
                setOpen(false);
                console.log("Invoice added successfully:", data);
            } else {
                alert("Error adding invoice!");
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    return(
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField fullWidth label="Gate Pass" name="gatePass" value={formData.gatePass} onChange={(e) => setFormData({ ...formData, gatePass: e.target.value })} required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth type="date" label="Date" name="modifyDate" value={formData.modifyDate} onChange={(e) => setFormData({ ...formData, modifyDate: e.target.value })} required />
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth select label="Supplier" name="supplierId" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} required>
                        {suppliers.map((supplier) => (
                            <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.supplier_name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {formData.products.map((product, index) => (
                    <Grid container item xs={12} spacing={3} key={index} alignItems="center">
                        <Grid item xs={4}>
                            <TextField fullWidth select label="Product" name="productId" value={product.productId} onChange={(e) => handleProductChange(index, e)} required>
                                {products.map((prod) => (
                                    <MenuItem key={prod.product_id} value={prod.product_id}>{prod.product_name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Qty" type="number" name="quantity" value={product.quantity} onChange={(e) => handleProductChange(index, e)} required />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Price" type="number" name="unitPrice" value={product.unitPrice} onChange={(e) => handleProductChange(index, e)} required />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Total" type="number" name="totalAmount" value={product.totalAmount} InputProps={{ readOnly: true }} />
                        </Grid>
                        <Grid item xs={2}>
                            <IconButton onClick={() => removeProductRow(index)} disabled={formData.products.length === 1}><Remove /></IconButton>
                            <IconButton onClick={addProductRow}><Add /></IconButton>
                        </Grid>
                    </Grid>
                ))}
                <Grid item xs={12}>
                    <Button variant="contained" color="primary" type="submit">Submit</Button>
                </Grid>
            </Grid>
        </Box>
    )
}