import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { apiKey, graphql } from "../utils/commons";

export default function ProductPriceChart({ productId }) {
    const [chartData, setChartData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey,
                    },
                    body: JSON.stringify({
                        query: `query fetchProducts($productId: Int!) {
                            imsdb_invoice_item(where: { product_id: { _eq: $productId }, invoice: {invoice_type: {_eq: "PURCHASE"}} }) {
                                unit_price  
                                invoice {
                                    invoice_date
                                }
                            }
                        }`,
                        variables: { productId },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const result = await response.json();
                const items = result.data.imsdb_invoice_item;

                // Transform API data into the required format
                const formattedData = items.map((item) => ({
                    date: item.invoice.invoice_date, // Keep date as is
                    price: item.unit_price || 0, // Ensure correct key mapping
                }));

                setChartData(formattedData);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchProducts();
    }, [productId]);

    return (
        <>
        <div style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
            {error ? <p>Error: {error}</p> : null}
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} spacing={20}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        interval={0} // Show all dates
                        angle={-45}
                        fontSize={10}
                        textAnchor="end"
                        padding="gap"
                    />
                    <YAxis
                        fontSize={10}
                        textAnchor="end"
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} dot={{ r: 5 }}>
                        <LabelList dataKey="price" position="top" />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </div>
        </>
    );
};