import React from 'react';
import {Dialog,DialogTitle,DialogContent,Typography,Button} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';



export function Popup(props){
    const theme = useTheme();
    const useStyles=makeStyles=>({
        dialogWrapper:{
            padding:theme.spacing(0),
            position:'absolute',
            top:theme.spacing(5),
            maxWidth: "90vw", // Allow it to take 90% of viewport width
            width: "auto" // Let the width adjust dynamically
        },
        dialogTitle:{
            padding:0
        }
    })

    const {title,children,openPopup,setOpenPopup} = props;
    const classes=useStyles();

    return (
        <Dialog open={openPopup} maxWidth={false} maxHeight={false}

                classes={{paper:classes.dialogWrapper}}>
            <DialogTitle style={{backgroundColor:'#3f51b5'}}>
                <div style={{display:'flex'}}>
                    <Typography  variant="h6" component="div" style={{flexGrow:1,color:"white"}}>
                        {title}
                    </Typography>
                    <Button onClick={()=>{setOpenPopup(false)}}>
                        <CloseIcon sx={{ color: "white"}} />
                    </Button>
                </div>
            </DialogTitle>
            <DialogContent dividers>
                <div>{children}</div>
            </DialogContent>
        </Dialog>
    )

}
