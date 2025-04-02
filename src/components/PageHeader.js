import React from 'react';
import { Paper, Card, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles'; // Import MUI Theme

const useStyles = makeStyles(() => ({
    root: {
        backgroundColor: 'lightblue',
        display: 'flex',
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,  // Manually set spacing instead of theme.spacing()
    },
    pageHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    pageIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        backgroundColor: '#f5f5f5',
        borderRadius: '50%',
        color: '#3c44b1',
    },
    pageTitle: {
        paddingLeft: 16,
    }
}));

export function PageHeader(props) {
    const theme = useTheme();  // Get the theme from MUI
    const classes = useStyles(theme); // Pass the theme to useStyles

    const { icon, title, subTitle } = props;

    return (
        <Paper elevation={2} className={classes.root}>
            <div className={classes.pageHeader}>
                <Card className={classes.pageIcon}>
                    {icon}
                </Card>
                <div className={classes.pageTitle}>
                    <Typography variant="h6">
                        {title}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                        {subTitle}
                    </Typography>
                </div>
            </div>
        </Paper>
    );
}