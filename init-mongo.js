db.createUser(
    {
        user: "laira",
        pwd: "laira",
        roles: [
            {
                role: "readWrite",
                db: "laira"
            }
        ]
    }
)
