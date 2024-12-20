import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles.css";
import { Select } from "antd";
import VerifyToken from "../../utils/VerifyToken";
import { Toaster, toast } from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import TabNav from "../../Shared/TabNav";
import baseUrl from "../../api/apiConfig";
import { Tooltip } from "@mui/material";
import axios from "axios";
import AuthToken from "../../utils/AuthToken";

const ScheduleATask = () => {
  const user = VerifyToken();
  const createdBy = user?.username;
  const [startDate, setStartDate] = useState(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [taskName, setTaskName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedMachine, setSelectedMachine] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [duration, setDuration] = useState("30 minutes");
  const [Loading, setLoading] = useState(false);
  const [isEstimate, setIsEstimate] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false)
  const [sendApproval, setSendApproval] = useState(false)
  const [machineForApproval, setMachineForApproval] = useState([])
  const [courses, setCourses] = useState([])

  const token = AuthToken();
  const timeSlots = [
    "08:30", "08:45", "09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00", "12:15", "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45", "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45", "19:00",
  ];

  const [machines, setMachines] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const machineResponse = await axios.get(`${baseUrl.machines}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setMachineForApproval(machineResponse.data.data);

        const titles = machineResponse.data.data.map(machine => machine.title);
        setMachines(titles);

        const coursesResponse = await axios.get(`${baseUrl.courses}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setCourses(coursesResponse.data.data); // Process this data as needed
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [token]);
  const durationMapping = {
    "15 minutes": 2,
    "30 minutes": 3,
    "45 minutes": 4,
    "1 hour": 5,
    "2 hours": 9,
    "3 hours": 13,
    "4 hours": 17,
    "5 hours": 21,
    "6 hours": 25,
  };
  const filteredOptions = machines.filter((o) => !selectedMachine.includes(o));
  const filteredCourse = courses.filter((o) => !selectedCourse.includes(o.course));
  const formatDuration = (duration) => {
    const durationFormatMapping = {
      "15 minutes": "00:15",
      "30 minutes": "00:30",
      "45 minutes": "00:45",
      "1 hour": "01:00",
      "2 hours": "02:00",
      "3 hours": "03:00",
      "4 hours": "04:00",
      "5 hours": "05:00",
      "6 hours": "06:00",
    };
    return durationFormatMapping[duration] || "00:00";
  };


  const handleTimeSlotClick = (slot) => {
    const selectedIndex = timeSlots.indexOf(slot);
    const durationInSlots = durationMapping[duration] || 0;

    const endIndex = selectedIndex + durationInSlots - 2;

    if (endIndex >= timeSlots.indexOf("19:00")) {
      toast.error(`For a duration of ${duration}, please select a start time no later than 19:00.`);
      return;
    }


    const isConflict = isSlotBooked(slot, durationInSlots);
    if (isConflict) {
      toast.error("The selected time slot overlaps with an already booked slot.");
      return;
    }

    const newSelectedSlots = [];
    for (let i = selectedIndex; i < selectedIndex + durationInSlots; i++) {
      if (i < timeSlots.length) {
        newSelectedSlots.push(timeSlots[i]);
      }
    }

    setSelectedTimeSlots(newSelectedSlots);
  };


  const isSlotBooked = (startSlot, durationInSlots) => {
    const startIndex = timeSlots.indexOf(startSlot);
    const endIndex = startIndex + durationInSlots - 1;

    return scheduledTasks.some((task) => {
      if (
        task.selectedMachine.some((machine) =>
          selectedMachine.includes(machine)
        )
      ) {
        const bookedStartTime = new Date(task.startDate);
        const bookedTimeSlots = task.selectedTimeSlots;

        if (bookedStartTime.toDateString() === startDate.toDateString()) {
          const taskStartIndex = timeSlots.indexOf(bookedTimeSlots[0]);
          const taskEndIndex = taskStartIndex + bookedTimeSlots.length - 1;

          if (
            (startIndex >= taskStartIndex && startIndex <= taskEndIndex) ||
            (endIndex >= taskStartIndex && endIndex <= taskEndIndex) ||
            (startIndex <= taskStartIndex && endIndex >= taskEndIndex)
          ) {
            return true;
          }
        }
      }
      return false;
    });
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (
      !taskName ||
      !duration ||
      selectedCourse.length === 0 ||
      selectedTimeSlots.length === 0 ||
      selectedMachine.length === 0
    ) {
      toast.error(
        "Please fill in all fields, select time slots, and choose at least one machine."
      );
      setLoading(false);
      return;
    }

    const formData = {
      sendApproval,
      taskName,
      selectedCourse,
      startDate: startDate.toISOString(),
      selectedTimeSlots: selectedTimeSlots.length > 0 ? selectedTimeSlots : [],
      selectedMachine,
      email,
      estimatedTime: duration,
      approve: "Pending",
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${baseUrl.scheduledtasks}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      toast.success(
        "Done!"
      );
      const nextValidDate = isWeekend(startDate) ? getNextWeekday() : startDate;
      setStartDate(nextValidDate);

      setTaskName("");
      setSelectedCourse([]);
      setEmail("");
      setSelectedMachine([]);
      setSelectedTimeSlots([]);
      setDuration("30 minutes");
      window.location.reload();
    } catch (error) {
      console.log(error);

      console.error("Error:", error);
      toast.error("There was a problem scheduling the task.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchScheduledTasks = async () => {
      try {
        const response = await fetch(`${baseUrl.scheduledtasks}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', // Optional, based on your API
          },
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const approvedData = data.data.filter(
          (item) => item.approve === "Approved" || item.approve === "Pending"
        );
        setScheduledTasks(approvedData);
      } catch (error) {
        console.error("Error fetching scheduled tasks:", error);
      }
    };

    fetchScheduledTasks();
  }, []);

  const handleEstimate = (e) => {
    if (e.target.checked) {

      const selectedMachineData = machineForApproval.find(machine => selectedMachine.includes(machine.title));
      setDuration(selectedMachineData?.duration || "30 minutes");
      setIsEstimate(true);
    } else {
      setIsEstimate(false);
    }
  }


  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  const getNextWeekday = () => {
    const today = new Date();
    const day = today.getDay();
    const nextWeekday = new Date(today);
    if (day === 6) {
      nextWeekday.setDate(today.getDate() + 2);
    } else if (day === 0) {
      nextWeekday.setDate(today.getDate() + 1);
    }
    return nextWeekday;
  };
  useEffect(() => {
    if (isWeekend(new Date())) {
      setStartDate(getNextWeekday());
    } else {
      setStartDate(new Date());
    }
  }, []);



  const handleSendApproval = (e) => {
    if (e.target.checked) {
      setSendApproval(true);
    } else {
      setSendApproval(false);
    }
  };
  const handleSelectMachine = (event) => {
    setSelectedMachine(event);
    const selectedMachineData = machineForApproval.find(machine => event.includes(machine.title));
    if (selectedMachineData && selectedMachineData.duration) {
      setDuration(selectedMachineData.duration);
    } else {
      setDuration("30 minutes");
    }

    const authorExists = machineForApproval.some(machine =>
      event.includes(machine.title) && machine.author
    );

    setIsAuthor(authorExists);
  };



  return (
    <>
      <TabNav />
      <div className="max-w-[1200px] mx-auto mt-5 lg:p-6 bg-white rounded-lg">
        <Toaster position="top-center" reverseOrder={false} />

        {Loading && <Loader text={""} />}

        {!Loading && (
          <div className="">
            <h4 className="text-xl p-1 font-bold text-[#515151] ">
              SCHEDULE A TASK
            </h4>
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center lg:px-10">
                  <label
                    htmlFor="taskName"
                    className="block p-1 mr-[39px] font-medium text-[15px] min-w-[71px]"
                  >
                    Task Name
                  </label>
                  <input
                    type="text"
                    name="taskName"
                    placeholder="Enter Task Name"
                    id="taskName"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="border text-[15px] w-[235px] h-8 p-1 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex flex-col relative w-fit">
                  <div className="flex items-center lg:px-10">
                    <label
                      htmlFor="course"
                      className="block p-1 mr-[54px] font-medium text-[15px] min-w-[71px]"
                    >
                      Course
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Please select Course"
                      value={selectedCourse}
                      onChange={setSelectedCourse}
                      style={{
                        width: "235px",
                        borderColor:
                          selectedCourse.length === 0 ? "red" : undefined,
                      }}
                      options={filteredCourse.map((item) => ({
                        value: item.course,
                        label: item.course,
                      }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col relative w-fit">
                  <div className="flex items-center lg:px-10">
                    <label
                      htmlFor="machine"
                      className="block p-1 mr-[54px] font-medium text-[15px] min-w-[71px]"
                    >
                      Machine
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Please select machines"
                      value={selectedMachine}
                      onChange={handleSelectMachine}
                      style={{
                        width: "235px",
                        borderColor:
                          selectedMachine.length === 0 ? "red" : undefined,
                      }}
                      options={filteredOptions.map((item) => ({
                        value: item,
                        label: item,
                      }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 bg-[#FAFAFA] py-3  ">
                  <div className="flex items-center gap-5  ">
                    <label
                      htmlFor="duration"
                      className="block font-medium text-[15px] px-10"
                    >
                      Duration:
                    </label>
                    <select
                      name="duration"
                      id="duration"
                      disabled={isEstimate}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="border text-[15px] border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Duration</option>
                      <option value="15 minutes">15 minutes</option>
                      <option selected="selected" value="30 minutes">30 minutes</option>
                      <option value="45 minutes">45 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                      <option value="3 hours">3 hours</option>
                      <option value="4 hours">4 hours</option>
                      <option value="5 hours">5 hours</option>
                      <option value="6 hours">6 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-5 bg-[#FAFAFA] ">
                    <label
                      htmlFor="estimatedTime"
                      className="flex items-center gap-5 font-medium text-[15px] px-10"
                    >
                      Estimated Time:
                      <span className="ml-2 text-[15px]">
                        {duration ? formatDuration(duration) : "30:00"}
                      </span>
                    </label>
                    <input
                      type="checkbox"
                      checked={isEstimate}
                      onChange={handleEstimate}
                    />
                    <label htmlFor="estimatedTime">Estimate it for me</label>
                  </div>

                </div>
                <div className="lg:px-10 pt-6">
                  <h2 className="text-[15px] text-center lg:text-start font-semibold">
                    Available Time Slot
                  </h2>
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex justify-center">
                      <div
                        className="max-w-[350px] border-gray-300
                     rounded p-4 mt-2 mb-5"
                      >
                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          inline
                          minDate={isWeekend(new Date()) ? getNextWeekday() : new Date()} // Make sure weekends aren't selected
                          filterDate={(date) => !isWeekend(date)} // Disable weekends
                        />

                      </div>
                    </div>
                    <div className="flex-1 text-center lg:hidden lg:text-start mb-20 lg:mt-0 font-semibold">
                      <p className="text-[24px]">
                        {startDate
                          ? startDate.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          : "Date not available"}
                      </p>
                      <div className="grid grid-cols-5 gap-3 mt-3 font-medium w-[250px] mx-auto">{selectedTimeSlots?.map((time, i) => <p className="bg-green-100 text-sm text-center px-1 rounded-full" key={i}>{time}</p>)}</div>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative ">
                      <div className="flex flex-col items-start gap-1 text-[15px] absolute -top-12 lg:left-20">
                        <div className="flex gap-2 ">
                          <div className="h-4 w-4 mt-1 bg-gray-400 rounded-md"></div>
                          <p className="text-[15px]"> Scheduled by others</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-4 w-4 mt-1 bg-white border border-black rounded-md"></div>
                          <p className="text-[15px]"> Available time slot</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 place-items-center mt-5">
                        {timeSlots.map((slot, index) => {
                          const isDisabled = isSlotBooked(slot);
                          return (
                            <div
                              key={index}
                              className={`px-2 py-1 text-[14px] cursor-pointer rounded transition-all duration-200 
                                                        ${selectedTimeSlots.includes(
                                slot
                              )
                                  ? "bg-blue-200 text-black"
                                  : isDisabled
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "hover:bg-blue-300"
                                }`}
                              onClick={() =>
                                !isDisabled && handleTimeSlotClick(slot)
                              }
                            >
                              {slot}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex-1 hidden lg:flex flex-col text-center lg:text-start mt-5 lg:mt-0 font-semibold">
                      <p className="text-[25px]">
                        {startDate
                          ? startDate.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          : "Date not available"}
                      </p>
                      <div className="grid grid-cols-5 gap-3 mt-3 font-medium">{selectedTimeSlots?.map((time, i) => <p className="bg-green-100 text-center text-sm rounded-full" key={i}>{time}</p>)}</div>
                    </div>
                  </div>
                </div>
                <div className="">
                  <Tooltip
                    title={
                      isAuthor
                        ? "Please check this box if you want to proceed"
                        : "This checkbox is for some specific machine"
                    }
                  >
                    <div className="flex items-center gap-4 bg-[#F2F4F6] text-[15px] px-10 py-5">
                      <p>
                        This machine requires faculty permission/availability.{" "}
                        <br /> Send for approval?
                      </p>

                      <input
                        disabled={!isAuthor}
                        required={isAuthor}
                        onClick={(e) => handleSendApproval(e)}
                        type="checkbox"
                      />
                    </div>
                  </Tooltip>

                  {/* <div className="flex items-center gap-4 px-10 text-[15px] py-5">
                    <p>I need a tutorial for this job</p>
                    <input type="checkbox" />
                  </div> */}
                </div>
                <div className="mt-4 px-10">
                  <button
                    type="submit"
                    className="bg-[#522C80] text-white px-4 py-2 rounded shadow text-[15px] hover:bg-[#754da7] transition"
                  >
                    SCHEDULE
                  </button>
                </div>
              </form>
              {/* <div className="mt-4 flex flex-col w-fit gap-5 px-10">
                                <p className="border-b w-fit">Share</p>
                                <div className="flex gap-5">
                                    <p className="ml-10">Type email:</p> <input className="border text-[15px] w-[235px] h-6 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-[#522C80] text-white px-4 py-2 w-fit rounded shadow text-[15px] hover:bg-[#754da7] transition"
                                >
                                    SHARE
                                </button>
                            </div> */}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ScheduleATask;