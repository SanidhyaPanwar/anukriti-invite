import React from "react";
import { 
  Container, List, ListItem, ListItemText, Typography, 
  Chip, Box, Paper 
} from '@mui/material';
import { useParams } from 'react-router-dom';

function ProgrammesTab({ events, inviteCode, guest }) {  // ← Added guest prop
  const { eventId } = useParams();

  // ← NEW: Filter events by inviteType
  const filteredEvents = events.filter(event => {
    if (guest?.inviteType === 'wedding') {
      // Wedding only: show only wedding ceremony
      return event.title.toLowerCase().includes('wedding') || 
      event.title.toLowerCase().includes('marriage') ||
      event.title.toLowerCase().includes('reception') ||
      event.title.toLowerCase().includes('ceremony');
    }
    return true;  // Complete: show all events
  });

  if (!filteredEvents?.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography>
          {guest?.inviteType === 'wedding' 
            ? 'Wedding ceremony details coming soon' 
            : 'No programmes added yet'
          }
        </Typography>
      </Paper>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {guest?.inviteType === 'complete' ? 'Complete Programmes' : 'Wedding Programmes'}
      </Typography>
      
      <List>
        {filteredEvents.map((evt) => {
          const themeColor = evt.title.toLowerCase();
          return (
            <ListItem 
              key={evt._id || evt.title}
              component="a"
              href={`/invite/${inviteCode}/event/${evt._id || evt.title.toLowerCase()}`}
              sx={{ 
                mb: 2, 
                p: 2,
                borderRadius: 2,
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <Paper sx={{ width: '100%', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={evt.title} 
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    label={evt.date} 
                    sx={{ ml: 1 }}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h6">{evt.time}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {evt.venue}
                </Typography>
              </Paper>
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
}

export default ProgrammesTab;
