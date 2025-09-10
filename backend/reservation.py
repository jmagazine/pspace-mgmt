class Reservation:

    def __init__(self, title, owner, start_time, endtime):
        self.title = title
        self.owner = owner
        self.start_time = start_time
        self.end_time = endtime

    def __str__(self):
        return f"Reservation(title={self.title}\nowner={self.owner}\nstart_time={self.start_time}\nend_time={self.end_time})"

    def __dict__(self):
        return {
            "title": self.title,
            "owner": self.owner,
            "start_time": self.start_time,
            "end_time": self.end_time,
        }
