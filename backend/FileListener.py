import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess
import dataPrep as dataPrep
import shutil


class Watcher:
    DIRECTORY_TO_WATCH = "./backend/UnprocessedFiles"

    def __init__(self):
        self.observer = Observer()

    def run(self):
        event_handler = Handler()
        self.observer.schedule(event_handler, self.DIRECTORY_TO_WATCH, recursive=True)
        self.observer.start()
        try:
            while True:
                time.sleep(5)
        except:
            self.observer.stop()
            print ("Error")

        self.observer.join()


class Handler(FileSystemEventHandler):

    # @staticmethod
    # def on_any_event(event):
    #     if (not (event.is_directory)):
    #         return None
    #     elif event.event_type == 'created':
    #         newfile= ((str(event.src_path).split("/"))[-1])
    #         subprocess.run(['mv',('./backend/UnprocessedFiles/'+newfile), './backend/files'])
    #         dataPrep.prepData(newfile)
    @staticmethod
    def on_any_event(event):
        if (not (event.is_directory)):
            return None
        elif event.event_type == 'created':
            #newfile=newfile.replace('\\','/')
            #newfile= ((str(event.src_path).split("/"))[-1])
            newfile=(str(event.src_path)).replace('\\','/')
            newfile= ((newfile.split("/"))[-1])
            print(newfile)
            source='./backend/UnprocessedFiles/'+newfile
            destination='./backend/files'
            shutil.move(source,destination)
            print("hello")
            #subprocess.run(['mv',('./backend/'+newfile), './backend/files'])
            dataPrep.prepData(newfile)




if __name__ == '__main__':
    w = Watcher()
    w.run()