import axios from "axios";
import React, { useState } from "react";
import {  FaSearch } from "react-icons/fa";

import { MdDelete } from "react-icons/md";
import baseUrl from "../../api/apiConfig";
import { useQuery } from "@tanstack/react-query";
import { Button, Dialog, DialogActions, DialogTitle } from "@mui/material";
import VerifyToken from "../../utils/VerifyToken";
import toast, { Toaster } from "react-hot-toast";

const Users = () => {
  const user = VerifyToken();
  const [searchQuery, setSearchQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [id, setId] = useState(null);
  const [username, setUsername] = useState(null);

  const handleClickOpen = (username) => {
    setOpen(true);
    setUsername(username);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const {
    isLoading,
    isError,
    data = [],
    error,
    refetch,
  } = useQuery({
    queryKey: ["userOrders"],
    queryFn: async () => {
      const response = await axios.get(`${baseUrl.users}`);
      return response.data.data;
    },
  });

  const filteredUsers = data.filter((machine) =>
    machine.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleRemoveUser = async (username) => {
    if (username !== user.username) {
      try {
        await axios.delete(`${baseUrl.users}/${username}`);
        handleClose();
        refetch();
        toast.success("User deleted successfully");
      } catch (error) {
        console.log("Error in deleting machine", error);
      }
    } else {
      toast.error("You can delete your own account");
    }
  };

  // const handleMakeAdmin = async (username) => {
  //   if (username !== user.username) {
  //     try {
  //       await axios.put(`${baseUrl.users}/${username}`, { role: "admin" });
  //       refetch();
  //       toast.success("Success");
  //     } catch (error) {
  //       console.log("Error in deleting machine", error);
  //     }
  //   } else {
  //     toast.error("You can't make any update to your own account");
  //   }
  // };

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex justify-between items-center ">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Users..."
            className="md:w-96 py-1.5 pl-10 border border-zinc-300 rounded-md focus:outline-none focus:border-orange-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute top-3 left-3 text-zinc-400" />
        </div>
      </div>

      <div className="mt-10 overflow-auto max-w-sm md:max-w-full max-h-[80vh]">
        <table className="min-w-full bg-white border border-gray-300 rounded-md">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">
                User
              </th>
              <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">
                Role
              </th>
              <th className="py-2 px-4 border-b border-gray-300 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((machine) => (
                <tr key={machine._id}>
                  <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-800">
                    {machine?.username}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-300 text-sm text-gray-800">
                    {machine?.role}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-300 text-3xl text-white">
                    <div className="flex items-center gap-6 h-8">
                      <button
                        onClick={() => handleClickOpen(machine?.username)}
                        className="flex items-center justify-center h-full text-red-500 border border-red-500 hover:bg-red-200 duration-300 ease-out rounded p-1"
                      >
                        <MdDelete style={{padding:'5px'}} />
                      </button>
                     {/* {machine?.role !== "admin" &&  <button
                        onClick={() => handleMakeAdmin(machine?.username)}
                        className="flex items-center justify-center h-full text-green-500 border border-green-500 font-semibold hover:bg-green-200 duration-300 ease-out rounded px-1 text-[10px] text-nowrap"
                      >
                        Make Admin
                      </button>} */}
                    
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="py-2 px-4 text-center text-gray-700">
                  No machines found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Machine Deletion"}
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => handleRemoveUser(username)}
            color="error"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;