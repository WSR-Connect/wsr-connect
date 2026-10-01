export const schoolDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export type SchoolDay = (typeof schoolDays)[number];

export const breakPeriods = ["Break 1", "Break 2"] as const;

export type BreakPeriod = (typeof breakPeriods)[number];

export type DutyArea = "Downstairs" | "Upstairs";

export interface BreakDutyPost {
  location: string;
  role?: string;
  assignments: Partial<Record<SchoolDay, string[]>>;
}

function acrossDays(
  days: readonly SchoolDay[],
  people: string[],
): Partial<Record<SchoolDay, string[]>> {
  return Object.fromEntries(
    days.map((day) => [day, [...people]]),
  ) as Partial<Record<SchoolDay, string[]>>;
}

const mondayToThursday = schoolDays.slice(
  0,
  4,
) as readonly SchoolDay[];

export const approvedVolunteers = {
  girls: [
    "Yusra Faryal (12G2)",
    "Haania Sajid (12G1)",
    "Yassmin Beheiry (12G1)",
    "Mahroo Khan (11G1)",
    "Wareesha Zaib (11G1)",
  ],
  boys: [
    "Rayan (12B2)",
    "Karam (12B1)",
    "Yagiz (12B2)",
    "Hassan (12B2)",
    "Saad Kronful (12B1)",
  ],
};

export const coverageInstructions = {
  downstairs:
    "In case you are absent or unable to complete your assigned duty, please let us know a day prior and coordinate with another member of the SRC who is free to cover for you. If there are no SRC members vailable, you may coordinate with one of the following approved volunteers. Let us know in advance if you will not be able to do your duty and inform us who will be covering for you.",
  upstairs:
    "In case you are absent or unable to complete your assigned duty, please let us know a day prior and coordinate with another member of the SRC who is free to cover for you. If there are no SRC members available, you may coordinate with one of the following approved volunteers. Let us know in advance if you will not be able to do your duty and inform us who will be covering for you.",
};

export const downstairsBreakDuties: Record<
  BreakPeriod,
  BreakDutyPost[]
> = {
  "Break 1": [
    {
      location: "EXIT 1 (Near Gate 6)",
      role: "Students are not permitted to use this exit to go up, unless G11/12. Ensure students are not loitering in the stairwell. Allow students to go up if they're coming from PE. Allow students to go up if they have a SIGNED note from a teacher.",
      assignments: acrossDays(mondayToThursday, ["Ibrahim"]),
    },
    {
      location: "EXIT 2 (Near Boys Canteen)",
      assignments: acrossDays(mondayToThursday, ["M.H"]),
    },
    {
      location: "EXIT 3 (Near Girls Canteen)",
      assignments: acrossDays(mondayToThursday, ["Tiara"]),
    },
    {
      location: "EXIT 4 (Near Cricket Field)",
      assignments: acrossDays(mondayToThursday, ["Ayesha"]),
    },
    {
      location: "Staircase Near Quadrangle",
      assignments: acrossDays(mondayToThursday, ["Hayk"]),
    },
    {
      location: "Staircase Lower Shaded Area",
      assignments: acrossDays(mondayToThursday, [
        "Mariam Hamadeh",
      ]),
    },
    {
      location: "Intersection (Front of MPH)",
      role: "Ensure Students are not loitering.",
      assignments: acrossDays(mondayToThursday, ["Joel"]),
    },
    {
      location: "Boys Washroom",
      role: "Only four students in Washroom at a time. Ensure students do not loiter in the washroom for longer than two minutes.",
      assignments: acrossDays(mondayToThursday, [
        "Hamzah (V)",
      ]),
    },
    {
      location: "Girls Washroom",
      assignments: acrossDays(mondayToThursday, ["Zimmal"]),
    },
    {
      location: "MPH Entrance",
      role: "Only allow students for the washroom in, four at a time. Students cannot loiter here.",
      assignments: acrossDays(mondayToThursday, ["Safaa"]),
    },
    {
      location: "Upper Shaded Area",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, ["Misk"]),
    },
    {
      location: "Lower Shaded Area",
      assignments: acrossDays(mondayToThursday, ["Praganya"]),
    },
    {
      location: "Girls Canteen",
      role: "Ensure students are not loitering in the walkway in front of the canteen. Ensure all students have left after break ends.",
      assignments: acrossDays(mondayToThursday, ["Khalisa"]),
    },
    {
      location: "Boys Canteen",
      assignments: acrossDays(mondayToThursday, ["Jad"]),
    },
    {
      location: "Quadrangle",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Bukhari",
        "Shayan",
      ]),
    },
    {
      location: "Field",
      assignments: acrossDays(mondayToThursday, [
        "Sinan",
        "Wesley",
      ]),
    },
    {
      location: "Basket Ball Court",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Innaya",
        "Sara Abutalib",
      ]),
    },
    {
      location: "Cricket Net",
      assignments: acrossDays(mondayToThursday, [
        "Devanshi",
      ]),
    },
    {
      location: "Upper Shaded Area",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Misk",
        "Zenia",
      ]),
    },
    {
      location: "Lower Shaded Area",
      assignments: acrossDays(mondayToThursday, [
        "Maryam Hassan",
        "Reema",
      ]),
    },
  ],

  "Break 2": [
    {
      location: "EXIT 1 (Near Gate 6)",
      role: "Students are not permitted to use this exit to go up, unless G11/12. Ensure students are not loitering in the stairwell. Allow students to go up if they're coming from PE. Allow students to go up if they have a SIGNED note from a teacher.",
      assignments: acrossDays(mondayToThursday, ["Sanad"]),
    },
    {
      location: "EXIT 2 (Near Boys Canteen)",
      assignments: acrossDays(mondayToThursday, ["Adney"]),
    },
    {
      location: "EXIT 3 (Near Girls Canteen)",
      assignments: acrossDays(mondayToThursday, [
        "Pragnaya",
      ]),
    },
    {
      location: "EXIT 4 (Near Cricket Field)",
      assignments: acrossDays(mondayToThursday, ["Mayan"]),
    },
    {
      location: "Staircase Near Quadrangle",
      assignments: acrossDays(mondayToThursday, ["Moaz"]),
    },
    {
      location: "Staircase Lower Shaded Area",
      assignments: acrossDays(mondayToThursday, ["Sharlin"]),
    },
    {
      location: "Intersection (Front of MPH)",
      role: "Ensure Students are not loitering.",
      assignments: acrossDays(mondayToThursday, [
        "Kianoush",
      ]),
    },
    {
      location: "Boys Washroom",
      role: "Only four students in Washroom at a time. Ensure students do not loiter in the washroom for longer than two minutes.",
      assignments: acrossDays(mondayToThursday, [
        "Hamzah (V)",
      ]),
    },
    {
      location: "Girls Washroom",
      assignments: acrossDays(mondayToThursday, ["Zaheen"]),
    },
    {
      location: "MPH Entrance",
      role: "Only allow students for the washroom in, four at a time. Students cannot loiter here.",
      assignments: acrossDays(mondayToThursday, ["Retaj"]),
    },
    {
      location: "Upper Shaded Area",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Fayrouz",
      ]),
    },
    {
      location: "Lower Shaded Area",
      assignments: acrossDays(mondayToThursday, ["Faryal"]),
    },
    {
      location: "Girls Canteen",
      role: "Ensure students are not loitering in the walkway in front of the canteen. Ensure all students have left after break ends.",
      assignments: acrossDays(mondayToThursday, ["Renoaa"]),
    },
    {
      location: "Boys Canteen",
      assignments: acrossDays(mondayToThursday, ["Omar"]),
    },
    {
      location: "Quadrangle",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Yousuf.H",
        "Habibur",
      ]),
    },
    {
      location: "Field",
      assignments: acrossDays(mondayToThursday, [
        "Jamal",
        "Seif Ahmed",
      ]),
    },
    {
      location: "Basket Ball Court",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Aziza",
        "Balqees",
      ]),
    },
    {
      location: "Cricket Net",
      assignments: acrossDays(mondayToThursday, ["Nourin"]),
    },
    {
      location: "Upper Shaded Area",
      role: "Patrol area and ensure safety of students. Once break ends, ensure all students leave in a timely manner through the correct exits.",
      assignments: acrossDays(mondayToThursday, [
        "Aaira",
        "Anaam",
      ]),
    },
    {
      location: "Lower Shaded Area",
      assignments: {
        Monday: ["Fatma"],
        Tuesday: ["Reema"],
        Wednesday: ["Reema"],
        Thursday: ["Reema"],
      },
    },
  ],
};

export const upstairsBreakDuties: Record<
  BreakPeriod,
  BreakDutyPost[]
> = {
  "Break 1": [
    {
      location: "Washroom New Building Corridor (Girls)",
      role: "Students need to have a hallpass to use the washroom. Ensure groups of students don't stay in the washroom for a long time. After bell has rung, clear washroom and ensure students have returned to class",
      assignments: acrossDays(schoolDays, ["Sara Qasem"]),
    },
    {
      location: "Washroom Middle Corridor (Girls)",
      assignments: acrossDays(schoolDays, ["Devanshi"]),
    },
    {
      location: "Washroom Old Building Corridor (Girls)",
      assignments: acrossDays(schoolDays, ["Sara Sen"]),
    },
    {
      location: "Washroom New Building Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["Sanad"]),
    },
    {
      location: "Washroom Middle Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["Kianoush"]),
    },
    {
      location: "Washroom Old Building Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["Y.H"]),
    },
    {
      location: "Library exit (Boys)",
      role: "Restrict students from passing",
      assignments: acrossDays(schoolDays, [
        "Hamzah (V)",
      ]),
    },
    {
      location: "New building exit (Boys)",
      role: "Restrict students from going downstairs",
      assignments: acrossDays(schoolDays, ["Moaz"]),
    },
    {
      location: "Exit near to Ms. Remya's office",
      assignments: acrossDays(schoolDays, ["Hayk"]),
    },
    {
      location: "Exit near to G11B common room",
      assignments: acrossDays(schoolDays, ["Wesley"]),
    },
    {
      location: "Exit 3 (Near Miss Hassina's Office)",
      assignments: acrossDays(schoolDays, [
        "Maryam Hassan",
      ]),
    },
    {
      location: "Near Miss Zipporah's Office",
      assignments: acrossDays(schoolDays, ["Mayan"]),
    },
    {
      location: "Science Lab Corridor (Girls)",
      role: "Ensure everyone entering the area has a hall pass and is there for a solid reason such as meeting a teacher and not loitering",
      assignments: acrossDays(schoolDays, ["Sharlin"]),
    },
  ],

  "Break 2": [
    {
      location: "Washroom New Building Corridor (Girls)",
      role: "Students need to have a hallpass to use the washroom. Ensure groups of students don't stay in the washroom for a long time. After bell has rung, clear washroom and ensure students have returned to class",
      assignments: acrossDays(schoolDays, ["Zaheen"]),
    },
    {
      location: "Washroom Middle Corridor (Girls)",
      assignments: {
        Monday: ["Fayrouz"],
        Tuesday: ["Sara Sen"],
        Wednesday: ["Sara Sen"],
        Thursday: ["Sara Sen"],
        Friday: ["Sara Sen"],
      },
    },
    {
      location: "Washroom Old Building Corridor (Girls)",
      assignments: {
        Monday: ["Sarah Sen"],
        Tuesday: ["Fayrouz"],
        Wednesday: ["Fayrouz"],
        Thursday: ["Fayrouz"],
        Friday: ["Fayrouz"],
      },
    },
    {
      location: "Washroom New Building Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["Joel"]),
    },
    {
      location: "Washroom Middle Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["Shayyan"]),
    },
    {
      location: "Washroom Old Building Corridor (Boys)",
      assignments: acrossDays(schoolDays, ["M.H"]),
    },
    {
      location: "Library exit (Boys)",
      role: "Restrict students from passing",
      assignments: acrossDays(schoolDays, [
        "Hamzah (V)",
      ]),
    },
    {
      location: "New building exit (Boys)",
      role: "Restrict students from going downstairs",
      assignments: acrossDays(schoolDays, ["Sinan"]),
    },
    {
      location: "Exit near to Ms. Remya's office",
      assignments: acrossDays(schoolDays, ["Jad"]),
    },
    {
      location: "Exit near to G11B common room",
      assignments: acrossDays(schoolDays, ["Jamal"]),
    },
    {
      location: "Exit 3 (Near Miss Hassina's Office)",
      assignments: acrossDays(schoolDays, ["Faryal"]),
    },
    {
      location: "Near Miss Zipporah's Office",
      assignments: acrossDays(schoolDays, ["Renoaa"]),
    },
    {
      location: "Science Lab Corridor (Girls)",
      role: "Ensure everyone entering the area has a hall pass and is there for a solid reason such as meeting a teacher and not loitering",
      assignments: acrossDays(schoolDays, ["Aziza"]),
    },
  ],
};

export interface DutyTimeSlot {
  label: string;
  time: string;
}

export const transitionDutyTimes: DutyTimeSlot[] = [
  { label: "Lesson 1", time: "07:40" },
  { label: "Registration", time: "08:25" },
  { label: "Lesson 2", time: "08:40" },
  { label: "Lesson 3", time: "09:30" },
  { label: "Lesson 4", time: "10:40" },
  { label: "Lesson 5", time: "11:25" },
  { label: "Lesson 6", time: "12:40" },
  { label: "Lesson 7", time: "01:25" },
];

export const fridayTransitionTimes = transitionDutyTimes.slice(0, 5);

export const corridorDutyTimes: DutyTimeSlot[] = [
  { label: "Lesson 1", time: "07:40" },
  { label: "Lesson 2", time: "08:40" },
  { label: "Lesson 3", time: "09:30" },
  { label: "Lesson 4", time: "10:40" },
  { label: "Lesson 5", time: "11:25" },
  { label: "Lesson 6", time: "12:40" },
  { label: "Lesson 7", time: "01:25" },
];

export const fridayCorridorTimes = corridorDutyTimes.slice(0, 4);

export const transitionDutyLocations = [
  "New Building Corridor",
  "Middle Corridor",
  "Middle Corridor",
  "Old Building Corridor",
] as const;

export type DutyGender = "girls" | "boys";

export type TimetableAssignments = Record<
  DutyGender,
  Record<SchoolDay, string[]>
>;

export const transitionDutyAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Maryam Hamadeh",
      "Sharlin",
      "Safa",
      "Tiara",
      "Sara Abutalib",
      "Nourin",
      "Aaira",
      "Maryam Hamadeh",
    ],
    Tuesday: [
      "Tiara",
      "Siri",
      "Ayesha",
      "Safa",
      "Khalisa",
      "Sarah Qasem",
      "Siri",
      "Maryam Hassan",
    ],
    Wednesday: [
      "Siri",
      "Siri",
      "Nourin",
      "Safa",
      "Maryam Hassan",
      "Fatma Abdullah",
      "Aaira",
      "Aaira",
    ],
    Thursday: [
      "Siri",
      "Fatma Abdullah",
      "Nourin",
      "Maryam Hassan",
      "Tiara",
      "Fatma Abdullah",
      "Aaira",
      "Mariam Hamadeh",
    ],
    Friday: [
      "Reenoa",
      "Maryam Hassan",
      "Tiara",
      "Sharlin",
      "Siri",
    ],
  },

  boys: {
    Monday: [
      "Yusuf Hassan",
      "Habibur",
      "Yusuf Hassan",
      "Karam (V)",
      "Ibrahim",
      "Wesley",
      "Habibur",
      "Moaz",
    ],
    Tuesday: [
      "Wesley",
      "Wesley",
      "Omar",
      "Moaz",
      "Hassan (V)",
      "Habibur",
      "Ibrahim",
      "Habibur",
    ],
    Wednesday: [
      "Wesley",
      "Moaz",
      "Sanad",
      "Habibur",
      "Hassan (V)",
      "Ibrahim",
      "Moaz",
      "Hassan (V)",
    ],
    Thursday: [
      "Wesley",
      "Habibur",
      "Hassan (V)",
      "Sanad",
      "Habibur",
      "Wesley",
      "Omar",
      "Hassan (V)",
    ],
    Friday: [
      "Wesley",
      "Yusuf Hassan",
      "Habibur",
      "Ibrahim",
      "Yusuf Hassan",
    ],
  },
};

export const transitionDutyMiddleAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Elena",
      "Eshaal",
      "Eshaal",
      "Eshaal",
      "Ayesha",
      "Ayesha",
      "Reenoa",
      "Aaira",
    ],
    Tuesday: [
      "Devanshi",
      "Devanshi",
      "Zimmal",
      "Fatma Abdullah",
      "Sara Abutalib",
      "Nourin",
      "Mariam Hamadeh",
      "Siri",
    ],
    Wednesday: [
      "Eshaal",
      "Eshaal",
      "Aziza",
      "Khalisa",
      "Ayesha",
      "Mariam Hamadeh",
      "Inaaya",
      "Inaaya",
    ],
    Thursday: [
      "Eshaal",
      "Mariam Hamadeh",
      "Zimmal",
      "Eshaal",
      "Safa",
      "Mayan",
      "Inaaya",
      "Tiara",
    ],
    Friday: [
      "Eshaal",
      "Nourin",
      "Mayan",
      "Eshaal",
      "Eshaal",
    ],
  },

  boys: {
    Monday: [
      "Omar",
      "Moaz",
      "Karam(V)",
      "Shayan",
      "Hassan (V)",
      "Ibrahim",
      "Yagiz (V)",
      "Habibur",
    ],
    Tuesday: [
      "Saad (V)",
      "Shayan",
      "Saad (V)",
      "Omar",
      "Moaz",
      "Yagiz (V)",
      "Yusuf Hassan",
      "Karam (V)",
    ],
    Wednesday: [
      "Habibur",
      "Yusuf Hassan",
      "Omar",
      "Saad (V)",
      "Joel",
      "Sanad",
      "Hassan (V)",
      "Omar",
    ],
    Thursday: [
      "Joel",
      "Yusuf Hassan",
      "Saad (V)",
      "Moaz",
      "Omar",
      "Saad (V)",
      "Moaz",
      "Omar",
    ],
    Friday: [
      "Shayan",
      "Moaz",
      "Saad (V)",
      "Joel",
      "Saad (V)",
    ],
  },
};

export const transitionDutyAdditionalMiddleAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Siri",
      "Mayan",
      "Elena",
      "Siri",
      "Aziza",
      "Zimmal Atif",
      "Zenia",
      "Zenia",
    ],
    Tuesday: [
      "Elena",
      "Elena",
      "Sarah",
      "Eshaal",
      "Nourin",
      "Mayan",
      "Safa",
      "Eshaal",
    ],
    Wednesday: [
      "Sharlin",
      "Elena",
      "Mayan",
      "Reenoa",
      "Zimmal",
      "Eshaal",
      "Zenia",
      "Zenia",
    ],
    Thursday: [
      "Sharlin",
      "Eshaal",
      "Devanshi",
      null as unknown as string,
      "Sara Abutalib",
      "Reenoa",
      "Zenia",
      "Reema",
    ],
    Friday: [
      "Elena",
      "Mariam Hamadeh",
      "Elena",
      "Siri",
      "Elena",
    ],
  },

  boys: {
    Monday: [
      "Wesley",
      "Saad (V)",
      "Omar",
      "Saad (V)",
      "Sinan",
      "Joel",
      "Hassan (V)",
      "Ibrahim",
    ],
    Tuesday: [
      "Shayan",
      "Muhammad H",
      "Habibur",
      "Karam (V)",
      "Hayk",
      "Moaz",
      "Sinan",
      "Joel",
    ],
    Wednesday: [
      "Shayan",
      "Karam (V)",
      "Moaz",
      "Sanad",
      "Karam (V)",
      "Yusuf Hassan",
      "Yagiz (V)",
      "Saad (V)",
    ],
    Thursday: [
      "Adney",
      "Muhammad H",
      "Karam (V)",
      "Shayan",
      "Moaz",
      "Karam (V)",
      "Adney",
      "Adney",
    ],
    Friday: [
      "Muhammad H",
      "Karam (V)",
      "Wesley",
      "Shayan",
      "Moaz",
    ],
  },
};

export const transitionDutyOldAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Devanshi",
      "Siri",
      "Maryam Hassan",
      "Sharlin",
      "Mayan",
      "Aziza",
      "Sarah Qasem",
      "Inaaya",
    ],
    Tuesday: [
      "Sharlin",
      "Sharlin",
      "Aziza",
      "Sarah",
      "Maryam Hassan",
      "Sara Abutalib",
      "Reema",
      "Inaaya",
    ],
    Wednesday: [
      "Sarah",
      "Sarah",
      "Sara Abutalib",
      "Sara Abutalib",
      "Devanshi",
      "Sarah",
      "Reema",
      "Reema",
    ],
    Thursday: [
      "Sarah",
      "Mayan",
      "Sarah",
      "Sarah Qasem",
      "Sharlin",
      "Sara Abutalib",
      "Reema",
      "Sharlin",
    ],
    Friday: [
      "Sarah",
      "Zimmal",
      "Reema",
      "Safa",
      "Sharlin",
    ],
  },

  boys: {
    Monday: [
      "Shayan",
      "Karam   (V)",
      "Muhammad H",
      "Muhammad H",
      "Yagiz (V)",
      "Hayk",
      "Sanad",
      "Sanad",
    ],
    Tuesday: [
      "Muhammad H",
      "Hayk",
      "Yusuf Hassan",
      "Sanad",
      "Yagiz (V)",
      "Hassan (V)",
      "Joel",
      "Sinan",
    ],
    Wednesday: [
      "Muhammad H",
      "Saad (V)",
      "Hayk",
      "Omar",
      "Yagiz (V)",
      "Wesley",
      "Shayan",
      "Hayk",
    ],
    Thursday: [
      "Hayk",
      "Shayan",
      "Yagiz (V)",
      "Muhammad H",
      "Sanad",
      "Hayk",
      "Yagiz (V)",
      "Hayk",
    ],
    Friday: [
      "Hayk",
      "Saad (V)",
      "Hayk",
      "Muhammad H",
      "Karam (V)",
    ],
  },
};

export const transitionDutyAssignmentsByLocation = {
  girls: [
    transitionDutyAssignments.girls,
    transitionDutyMiddleAssignments.girls,
    transitionDutyAdditionalMiddleAssignments.girls,
    transitionDutyOldAssignments.girls,
  ],
  boys: [
    transitionDutyAssignments.boys,
    transitionDutyMiddleAssignments.boys,
    transitionDutyAdditionalMiddleAssignments.boys,
    transitionDutyOldAssignments.boys,
  ],
} as const;

export const corridorDutyLocations = [
  "New Building Corridor",
  "Old Building Corridor",
] as const;

export const corridorDutyAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Eshaal",
      "Mayan",
      "Siri",
      "Devanshi",
      "Nourin",
      "Zenia",
      "Mariam Hamadeh",
    ],
    Tuesday: [
      "Devanshi",
      "Eshaal",
      "Mariam Hamadeh",
      "Nourin",
      "Sharlin",
      "Sharlin",
      "Inaaya",
    ],
    Wednesday: [
      "Elena",
      "Safa",
      "Renoaa",
      "Maryam Hassan",
      "Eshaal",
      "Ayesha",
      "Aaira",
    ],
    Thursday: [
      "Eshaal",
      "Devanshi",
      "Eshaal",
      "Mayan",
      "Renoaa",
      "Reema",
      "Sharlin",
    ],
    Friday: [
      "Eshaal",
      "Sara Abutalib",
      "Siri",
      "Eshaal",
    ],
  },

  boys: {
    Monday: [
      "wesley",
      "Moaz",
      "Shayan",
      "Joel",
      "Ibrahim",
      "Adney",
      "Ahmed",
    ],
    Tuesday: [
      "hassan (V)",
      "Hayk",
      "Karam (V)",
      "Moaz",
      "Ibrahim",
      "Ibrahim",
      "Habibur",
    ],
    Wednesday: [
      "wesley",
      "Yusuf Hassan",
      "Omar",
      "Sanad",
      "Hassan (V)",
      "Habibur",
      "Moaz",
    ],
    Thursday: [
      "hassan (V)",
      "Wesley",
      "Yusuf Hassan",
      "Saad (V)",
      "Habibur",
      "Omar",
      "Moaz",
    ],
    Friday: [
      "wesley",
      "Saad (V)",
      "Moaz",
      "Yusuf Hassan",
    ],
  },
};

export const corridorDutyOldAssignments: TimetableAssignments = {
  girls: {
    Monday: [
      "Siri",
      "Fatma Abdullah",
      "Maryam Hassan",
      "Tiara",
      "Zimmal",
      "Ayesha",
      "Inaaya",
    ],
    Tuesday: [
      "Tiara",
      "Siri",
      "Sarah Qasem",
      "Khalisa",
      "Sara Abutalib",
      "Reema",
      "Zenia",
    ],
    Wednesday: [
      "Sarah Sen",
      "Khalisa",
      "Mayan",
      "Sarah Sen",
      "Zimmal",
      "Inaaya",
      "Sara Abutalib",
    ],
    Thursday: [
      "Elena",
      "Sarah Sen",
      "Maryam Hassan",
      "Nourin",
      "Khalisa",
      "Aaira",
      "Mariam Hamadeh",
    ],
    Friday: [
      "Sarah",
      "Safa",
      "Fatma Abdullah",
      "Elena",
    ],
  },

  boys: {
    Monday: [
      "hayk",
      "M.H",
      "Habibur",
      "Yusuf Hassan",
      "Sinan",
      "Karam (V)",
      "Sofyan",
    ],
    Tuesday: [
      "yagiz (V)",
      "Wesley",
      "Saad (V)",
      "Omar",
      "Yusuf Hassan",
      "Joel",
      "Sinan",
    ],
    Wednesday: [
      "Muhammad H",
      "Karam (V)",
      "Hayk",
      "Sinan",
      "Yagiz  (V)",
      "Shayan",
      "Saad (V)",
    ],
    Thursday: [
      "Joel",
      "Shayan",
      "Muhammad H",
      "Hayk",
      "Sanad",
      "Yagiz",
      "Hamzah (V)",
    ],
    Friday: [
      "Muhammad H",
      "Hayk",
      "Joel",
      "Shayan",
    ],
  },
};

export const corridorDutyAssignmentsByLocation = {
  girls: [
    corridorDutyAssignments.girls,
    corridorDutyOldAssignments.girls,
  ],
  boys: [
    corridorDutyAssignments.boys,
    corridorDutyOldAssignments.boys,
  ],
} as const;

export const transitionDutyRole =
  "Begin your duty at your assigned location at the stated time. Ensure that everyone is walking on their right and actively moving to lessons. Do not let students stand in the corridors and block the way. Assist students find their classrooms and teachers if needed. Ensure everyone is getting to class on time.";

export const corridorDutyRole =
  "Once you have completed transition duty, there will be a single desk in the middle of the old building corridor and another one in the middle of the new building corridor directly facing eachother. You may use that seat to carry on with your studies while on corridor duty. You must ensure that the corridor you are assigned to does not have any students loitering about, anyone outside of class has a hall pass. Make sure students are not taking too long or wasting time in the toilets. Ensure that there is a teacher present in every classroom with students and that nobody is sitting in an empty classroom alone or skipping their classes. The desks are strategically placed to allow the students on duty to monitor the corridor they are in as well as the middle corridor.";