'use client';

import { useEffect, useState } from 'react';  
import UpdateCard from "../components/UpdateCard";

export default function UpdatesPage() {
  
   
  const updates = [
    {
      id: 1,
      title: 'Welcome to the Hackathon!',
        content: 'We are excited to kick off the hackathon. Stay tuned for updates!',
        priority: 'high',
        pinned: true,
        created_at: '2024-06-01T10:00:00Z',
    },
    {
      id: 2,
      title: 'Schedule Released',
        content: 'The schedule for the hackathon has been released. Check it out on the website.',
        priority: 'normal',
        pinned: false,
        created_at: '2024-06-02T12:00:00Z',
    },
    {
      id: 3,
      title: 'New Mentor Added',
        content: 'We have added a new mentor to our team. Welcome aboard!',
        priority: 'low',
        pinned: false,
        created_at: '2024-06-03T14:00:00Z',
    },
  ]

  return (
    <div className='bg-black w-full min-h-screen'>
      <div className="max-w-3xl py-10 mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-left">Updates</h1>
        <div className="flex flex-col gap-2">
          {updates.map(updates => (
            <UpdateCard key={updates.id} update_props={updates} />
          ))}
        </div>
      </div>
    </div>
  );
}
