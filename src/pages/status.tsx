import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import Nav from "@/components/nav";
import styles from "@/styles/Status.module.css";
import { Line, Bar } from "react-chartjs-2";
import dynamic from "next/dynamic";
import Head from "next/head";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
  Tooltip,
  Legend
);

export const optionData = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  title: {
    text: "",
    display: true,
  },
  tooltips: {
    callbacks: {
      label: (tooltipItem: { yLabel: any; xLabel: any; }) =>
        `${tooltipItem.yLabel}: ${tooltipItem.xLabel}`,
      title: () => null,
    },
  },
};


const getLastDays = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const tag = new Date(today);
    tag.setDate(tag.getDate() - i);

    const tagString = tag.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    days.push(tagString);
  }

  return days;
};

const dayMap: { [key: number]: string } = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const getPastWeekDays = () => {
  const today = new Date();
  const pastWeekDays = [];

  for (let i = 0; i < 7; i++) {
    const pastDay = new Date(today);
    pastDay.setDate(today.getDate() - i);
    pastWeekDays.unshift(dayMap[pastDay.getDay()]);
  }

  return pastWeekDays;
};

export async function getServerSideProps() {
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const formattedDate = `${day}.${month}.${year}`;

  let urls = [];
  let reqCounts = [];
  let total = 0;
  let pastWeekData = [];
  let botCount = 0;

  try {
    const apiResponse = await fetch('https://ghibli.rest/stats');
    const apiData = await apiResponse.json();
    const responseData = apiData[formattedDate];
    urls = responseData.map((item: { url: any; }) => item.url);
    reqCounts = responseData.map((item: { req: any; }) => item.req ? item.req : 0);
    total = apiData.total;

    let dayDataList: any[] = [];
    getLastDays().forEach((day) => {
      const dayData = apiData[day];
      if (dayData) {
        dayDataList.push(
          dayData.map((item: { req: any; }) => item.req).reduce((a: any, b: any) => a + b, 0)
        );
      } else {
        dayDataList.push(0);
      }
    });

    pastWeekData = dayDataList;
  } catch (error) {
    console.error("Error fetching stats:", error);
  }

  try {
    const discordResponse = await fetch('https://japi.rest/discord/v1/application/1112770259024351252');
    const discordData = await discordResponse.json();
    botCount = discordData.data.bot.approximate_guild_count;
  } catch (error) {
    console.error("Error fetching Discord data:", error);
  }

  return {
    props: {
      urls,
      reqCounts,
      total,
      pastWeekData,
      botCount,
    },
  };
}

const Status = ({ urls, reqCounts, total, pastWeekData, botCount }: {
  urls: string[],
  reqCounts: number[],
  total: number,
  pastWeekData: number[],
  botCount: number
}) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch("https://ghibli.rest/ping");
        if (response.ok) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch (error) {
        setIsOnline(false);
      }
    };

    checkApiStatus();
  }, []);

  const data = {
    labels: getPastWeekDays(),
    datasets: [
      {
        label: "Requests",
        data: pastWeekData, // Example request data for each day
        fill: true,
        borderColor: "rgba(255,255,255,1)",
        backgroundColor: "rgba(255,255,255,0.4)",
        tension: 0.4,
      },
    ],
  };

  const data2 = {
    labels: urls,
    datasets: [
      {
        label: "Usage",
        data: reqCounts, // Example request data for each day
        backgroundColor: "rgba(255,255,255,0.5)",
        tension: 0.4,
      },
    ],
  };


  return (
    <>
      <Head>
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        ></link>
      </Head>
      <main className={`${styles.main}`}>
        <Nav />
        <div className={`${styles.status}`}>
          <h1>{}</h1>
          <h1 className={`${styles.title}`}>
            Ghibli.rest is {isOnline ? "online" : "offline"}
          </h1>
          <span
            className={`${isOnline ? styles.online : styles.offline}`}
          ></span>
        </div>
        <div className={`${styles.graphs}`}>
          <div className={`${styles.container}`}>
            <h1 className={styles.legend}>Requests in the past 7 days</h1>
            <Line options={optionData} data={data} draggable={false} />
          </div>
          <div className={`${styles.container}`}>
            <h1 className={styles.legend}>Most requested endpoints today</h1>
            <Bar options={optionData} data={data2} draggable={false} />
          </div>
        </div>
        <div className={`${styles.boxcontainer}`}>
          <div className={`${styles.box}`}>
            <p>$0</p>
            <h2>Donations Recieved</h2>
            </div>
            <div className={`${styles.box}`}>
            <p>{total.toLocaleString()}</p>
            <h2>Lifetime API Requests</h2>
            </div>
            <div className={`${styles.box}`}>
            <p>{botCount.toLocaleString()}</p>
            <h2>Discord Servers</h2>
            </div>
         </div>
      </main>
    </>
  );
};

export default dynamic(() => Promise.resolve(Status), { ssr: false });
