
import React, { useState, useEffect } from "react";
import { TextField, MenuItem, Button, Box, Grid, IconButton } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { graphql, apiKey, companyID, getProductsURL, transactionReference,SALES_REVENUE_ACCOUNT_ID } from "../utils/commons";

export default function InvoiceOutForm(props){
    const {setRefresh, setOpen} = props;
    const [formData, setFormData] = useState({
        truckNumber: "",
        modifyDate: new Date().toISOString().split("T")[0],
        customerId: "",
        products: [{ productId: "", quantity: "", unitPrice: "", totalAmount: "" }],
    });
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
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
        const fetchCustomers = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                    body: JSON.stringify({
                        query:`query fetchCustomers{
                          imsdb_customer {
                            customer_name
                            customer_id
                            accounts {
                              account_id
                            }
                          }
                        }`
                    })
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();
                setCustomers(data.data.imsdb_customer);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchCustomers();
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
                    query: `query getAccountId($customerId: Int!) {
                        imsdb_account(where: { customer_id: { _eq: $customerId } }) {
                            account_id
                            balance
                        }
                    }`,
                    variables: { customerId: formData.customerId },
                }),
            });
            let accountData = await accountResponse.json();
            let accountId = accountData.data.imsdb_account[0]?.account_id;
            //////////////////////
            const transactionReference = `TXN-${Date.now()}`;
            let supplierBalance = accountData.data.imsdb_account[0]?.balance + totalAmount;
            if (!accountId) {
                alert("No account found for this supplier.");
                return;
            }

            const response = await fetch(graphql, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": apiKey
                },
                body: JSON.stringify({
                    query: `mutation addInvoice(
                              $customerId: Int!,
                              $totalAmount: Int!,
                              $invoiceDate: date!,
                              $truckNumber: String!,
                              $invoiceType:String!,
                              $companyId: Int!,
                              $status: String!,
                              $invoiceItems: [imsdb_invoice_item_insert_input!]!,
                              $accountId: Int!,
                              $supplierBalance: Int!,
                              $transactionReference:String!,
                              $salesAccountId: Int!,
                              $userId: Int!,
                              $log:String!
                            ) {
                              # Insert the invoice along with invoice items and account transaction
                              insert_imsdb_invoice_one(
                                object: {
                                  customer_id: $customerId,
                                  company_id: $companyId,
                                  truck_number: $truckNumber,
                                  total_amount: $totalAmount,
                                  invoice_date: $invoiceDate,
                                  status: $status,
                                  invoice_type: $invoiceType,
                                  invoice_items: { data: $invoiceItems },
                                  account_transactions: {  # Nested insert
                                    data: [
                                      {
                                        account_id: $accountId,
                                        transaction_type: "DEBIT",
                                        amount: $totalAmount,
                                        transaction_date: $invoiceDate,
                                        transaction_reference:$transactionReference
                                      },
                                      {
                                        account_id: $salesAccountId,
                                        transaction_type: "CREDIT",
                                        amount: $totalAmount,
                                        transaction_date: $invoiceDate,
                                        transaction_reference:$transactionReference                                     
                                      }
                                    ]
                                  }
                                }
                              ) {
                                invoice_id
                                truck_number,
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
                            
                              # Update the account balance for the supplier
                              update_customer_account:update_imsdb_account_by_pk(
                                pk_columns: { account_id: $accountId },
                                _set: { balance: $supplierBalance }
                              ) {
                                account_id
                              }
                              
                             # Update the sales account balance
                              update_sales_account:update_imsdb_account_by_pk(
                                pk_columns: { account_id: $salesAccountId },
                                _inc: { balance: $totalAmount }
                              ) {
                                account_id
                              }
                              
                           insert_imsdb_user_log(objects: {user_id: $userId, log: $log, log_date: $invoiceDate,action:"Sell Products"}) {
                                affected_rows
                                returning {
                                  user_log_id
                                }
                              }
                              
                            }`,
                    variables: {
                        customerId: formData.customerId,
                        companyId: companyID,
                        invoiceType:'SELL',
                        truckNumber:formData.truckNumber,
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
                        salesAccountId:SALES_REVENUE_ACCOUNT_ID,
                        userId:localStorage.getItem("userId"),
                        log:JSON.stringify(formData),
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
                <Grid item xs={12}>
                    <TextField fullWidth select label="Customer" name="customerId" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} required>
                        {customers?.map((customer) => (
                            <MenuItem key={customer.customer_id} value={customer.customer_id}>{customer.customer_name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Truck Number" name="truckNumber" value={formData.truckNumber} onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })} required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth type="date" label="Date" name="modifyDate" value={formData.modifyDate} onChange={(e) => setFormData({ ...formData, modifyDate: e.target.value })} required />
                </Grid>

                {formData.products?.map((product, index) => (
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