    // Athlete routes
    {
      path: "/athlete-progress",
      name: "athlete-progress",
      component: AthleteProgress,
    },
    {
      path: "/record-workout",
      name: "record-workout",
      component: RecordWorkout,
    },
    {
      path: "/workout-schedule",
      name: "workout-schedule",
      component: WorkoutSchedule,
    },
    {
      path: "/my-coaches",
      name: "my-coaches",
      component: MyCoaches,
    },
    // Workout routes
    {
      path: "/workout-session",
      name: "workout-session",
      component: () => import("./views/WorkoutSession.vue"),
    },
    {
      path: "/record-exercise",
      name: "record-exercise",
      component: () => import("./views/RecordExercise.vue"),
    },
  ],
});