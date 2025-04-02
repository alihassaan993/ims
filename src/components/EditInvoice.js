import React, { useState, useEffect } from "react";
import {TextField, MenuItem, Button, Box, Grid, CircularProgress, IconButton} from "@mui/material";
import {  Delete } from "@mui/icons-material";
import { Add, Remove } from "@mui/icons-material";
import {
    graphql,
    apiKey,
    companyID,
    getProductsURL,
    getSuppliersURL,
    getInvoiceURL,
    INVENTORY_ACCOUNT_ID
} from "../utils/commons";

export default function EditInvoice(props) {
    const {invoiceId,setEOpen,setRefresh} = props;
    const [formData, setFormData] = useState({
        gatePass: "",
        modifyDate: "",
        supplierId: "",
        products: [],
        accountId:"",
        accountBalance:"",
    });
    const [oldTotalAmount, setOldTotalAmount] = useState(0);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [error, setError] = useState(null);
    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                console.log("Fetching invoice details of invoice " + invoiceId);
                const response = await fetch(`${getInvoiceURL}?invoiceid=${invoiceId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();

                const invoice = data?.imsdb_invoice[0];
                //console.log("Invoice " + JSON.stringify(invoice));
                setFormData({
                    gatePass: invoice.invoice_number,
                    modifyDate: invoice.invoice_date,
                    supplierId: invoice.supplier_id,
                    oldTotalAmount:invoice.total_amount,
                    products: invoice.invoice_items.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                        unitPrice: item.unit_price,
                        totalAmount: item.total_price,
                    })),
                    accountId: invoice.supplier.accounts[0].account_id,
                    accountBalance: invoice.supplier.accounts[0].balance
                });
                setOldTotalAmount(formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0));
                setLoadingInvoice(false);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchInvoice();
    }, [invoiceId]);

    useEffect(() => {
        console.log("Updated accountBalance:", formData.accountBalance);
    }, [formData]);

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
                setLoadingProducts(false);
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
                setLoadingSuppliers(false);
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
        updatedProducts[index].totalAmount = updatedProducts[index].quantity * updatedProducts[index].unitPrice;
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
            const totalAmount = formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0);
            let updatedAmount= formData.accountBalance - (formData.oldTotalAmount-totalAmount);
            console.log("Invoice ID " + invoiceId);
            console.log("FormData " + JSON.stringify(formData));
            console.log("total Amount ",totalAmount, " old Amount ",oldTotalAmount );

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

            //let supplierBalance = accountData.data.imsdb_account.find(acc => acc.supplier_id === formData.supplierId).balance + totalAmount;
            let accountId = accountData.data.imsdb_account.find(acc => acc.supplier_id === formData.supplierId).account_id;

            let inventoryBalance = accountData.data.imsdb_account.find(acc => acc.account_id === INVENTORY_ACCOUNT_ID).balance - (formData.oldTotalAmount-totalAmount);


            //////////////////////

            const transactionReference = `TXN-${Date.now()}`;

            const response = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query:`
                    mutation updateInvoice(
                      $invoiceId: Int!,
                      $supplierId: Int!,
                      $totalAmount: Int!,
                      $invoiceDate: date!,
                      $invoiceNumber: String!,
                      $status: String!,
                      $companyId: Int!,
                      $invoiceItems: [imsdb_invoice_item_insert_input!]!,
                      $updatedBalance: Int!,
                      $accountId:Int!,
                      $transactionReference:String!,
                      $inventoryAccountId:Int!,
                      $inventoryBalance:Int!
                    ) {
                      update_imsdb_invoice_by_pk(
                        pk_columns: { invoice_id: $invoiceId },
                        _set: {
                          supplier_id: $supplierId,
                          company_id: $companyId,
                          invoice_number: $invoiceNumber,
                          total_amount: $totalAmount,
                          invoice_date: $invoiceDate,
                          status: $status
                        }
                      ) {
                        invoice_id
                        invoice_number
                        total_amount
                        invoice_date
                        status
                      }
                    
                      delete_imsdb_invoice_item(where: { invoice_id: { _eq: $invoiceId } }) {
                        affected_rows
                      }
                    # Delete the related account transaction
                    delete_imsdb_account_transaction(
                        where: {
                        invoice_id: { _eq: $invoiceId }
                    }
                    ) {
                        affected_rows
                    }
                    
                    insert_imsdb_invoice_item(
                        objects: $invoiceItems
                    ) {
                        affected_rows
                    returning {
                          invoice_item_id
                          product_id
                          unit_price
                          quantity
                          total_price
                    }
                    }

                    insert_supplier_tranaction:insert_imsdb_account_transaction
                    (objects: {account_id: $accountId amount: $totalAmount, invoice_id: $invoiceId, 
                    transaction_date: $invoiceDate, transaction_type: "CREDIT",transaction_reference: $transactionReference}) {
                    affected_rows
                    }
                    
                    insert_inventory_tranaction:insert_imsdb_account_transaction
                    (objects: {account_id: $inventoryAccountId amount: $totalAmount, invoice_id: $invoiceId, 
                    transaction_date: $invoiceDate, transaction_type: "DEBIT",transaction_reference: $transactionReference}){
                    affected_rows
                    }

                    update_supplier_account: update_imsdb_account_by_pk(
                        pk_columns: { account_id: $accountId },
                        _set: { balance: $updatedBalance }
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
                        invoiceId,
                        supplierId: formData.supplierId,
                        invoiceNumber: formData.gatePass,
                        invoiceDate: formData.modifyDate,
                        totalAmount:totalAmount,
                        companyId: companyID,
                        status: "Pending",
                        invoiceItems: formData.products.map(item => ({
                            invoice_id:invoiceId,
                            product_id: Number(item.productId),
                            unit_price: Number(item.unitPrice),
                            quantity: Number(item.quantity),
                            total_price: Number(item.totalAmount),
                        })),
                        updatedBalance:updatedAmount,
                        accountId:accountId,
                        transactionReference:transactionReference,
                        inventoryAccountId:INVENTORY_ACCOUNT_ID,
                        inventoryBalance:inventoryBalance
                    }
                })
            });
            const responseData = await response.json();
            console.log("GraphQL Response:", responseData);
            if (responseData.errors) {
                console.error("GraphQL Errors:", responseData.errors);
                alert("Error updating invoice! " + responseData.errors[0].message);
                return;
            }
            alert("Invoice Updated Successfully!");
            setEOpen(false);
            setRefresh(Math.random());
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            console.log("Deleting Invoice with ID:", invoiceId);
            console.log("Account ID:", formData.accountId);  // Debugging check


            const totalAmount = formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0);
            let updatedBalance=formData.accountBalance-totalAmount;

            const response = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query: `mutation deleteInvoice(
                              $invoiceId: Int!,
                              $accountId: Int!,
                              $updatedBalance: Int!
                            ) {
                              # Delete invoice items first (assuming foreign key constraint)
                              delete_imsdb_invoice_item(where: { invoice_id: { _eq: $invoiceId } }) {
                                affected_rows
                              }
                            
                            
                              # Update the account balance for the supplier
                              update_imsdb_account_by_pk(
                                pk_columns: { account_id: $accountId },
                                _set: { balance: $updatedBalance }
                              ) {
                                account_id
                                balance
                              }
                            
                              # Delete the related account transaction
                              delete_imsdb_account_transaction(
                                where: {
                                  invoice_id: { _eq: $invoiceId }
                                }
                              ) {
                                affected_rows
                              }
                              
                              
                              # Delete the invoice
                              delete_imsdb_invoice_by_pk(invoice_id: $invoiceId) {
                                invoice_id
                                invoice_number
                              }
                            }`,
                    variables: {
                        invoiceId,
                        accountId:formData.accountId,
                        updatedBalance: updatedBalance
                    }
                })
            });
            const responseData = await response.json();
            if (responseData.errors) {
                console.error("GraphQL Errors:", responseData.errors);
                alert("Error deleting invoice! " + responseData.errors[0].message);
                return;
            }
            alert("Invoice Deleted Successfully!");
            setEOpen(false);
            setRefresh(Math.random());
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    if (loadingInvoice || loadingProducts || loadingSuppliers) {
        return <CircularProgress />;
    }
    return (
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
                        {suppliers.map(supplier => (
                            <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.supplier_name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {formData.products.map((product, index) => (
                    <Grid container item xs={12} spacing={3} key={index} alignItems="center">
                        <Grid item xs={4}>
                            <TextField fullWidth select label="Product" name="productId" value={product.productId} onChange={(e) => handleProductChange(index, e)} required>
                                {products.map(prod => (
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
                <Grid container item xs={12} spacing={50}>
                    <Grid item xs={6}>
                        <Button variant="contained" color="primary" type="submit">Update Invoice</Button>
                    </Grid>

                    <Grid item xs={6}>
                        <Button variant="contained" color="secondary" startIcon={<Delete />} onClick={handleDelete}>
                            Delete Invoice
                        </Button>
                    </Grid>

                </Grid>
            </Grid>
        </Box>
    );
}
