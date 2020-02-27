import sys
import os 
import subprocess
import subprocess
import threading
import time


# initial data 
clients = []
logs_number = [1, 3, 2, 4]
n = len(sys.argv)
n -= 1


# initial clients list with correct order
if n < 3:
	print('arguments not enough.')
	exit()
elif n == 3:
	clients = [ sys.argv[3], sys.argv[3], sys.argv[3], sys.argv[3]]
elif n == 4:
	clients = [ sys.argv[3], sys.argv[4], sys.argv[4], sys.argv[4]]
elif n == 5:
	clients = [ sys.argv[3], sys.argv[5], sys.argv[4], sys.argv[5]]
elif n == 6:
	clients = [ sys.argv[3], sys.argv[5], sys.argv[4], sys.argv[6]]
else:
	print('too many arguments.')
	exit()
	

# create clients' logs path
base = 'Log'
if not os.path.exists(base): os.mkdir(base)
base += '/clients'
if not os.path.exists(base): os.mkdir(base)


# set map
os.environ['AICMap'] = sys.argv[2]



# define function to write output to file
def write_to_file(log_des, output):
	with open(log_des, 'w+') as f:
		f.write(str(output) )
		f.flush()

# functions for compiling and running different clients

def server():
	subprocess.run(['java', '-jar', sys.argv[1]], check=True)

def python(address, log_des):
	process = subprocess.run(['python3', os.path.join(address, 'controller.py')], check=True, stdout=subprocess.PIPE, universal_newlines=True)
	output = process.stdout
	write_to_file(log_des, output)

def java(address, log_des):
	java_files = []
	for (dirpath, dirnames, filenames) in os.walk(address):
		p = [os.path.join(dirpath, f) for f in filenames if f[-5:] == '.java']
		java_files.extend(p)
	subprocess.run(['javac', '-classpath', os.path.join(address,  'src', 'gson-2.8.5.jar:')] + java_files, check=True, stdout=subprocess.PIPE, universal_newlines=True)
	process = subprocess.run(['java', '-classpath', os.path.join(address, 'src:' + address, 'src', 'gson-2.8.5.jar:'), os.path.join('Client', 'Main')], check=True, stdout=subprocess.PIPE, universal_newlines=True)
	output = process.stdout
	write_to_file(log_des, output)
	

def cpp(address, log_des):
	build_dir = os.path.join(address, 'build')
	if not os.path.exists(build_dir): os.mkdir(build_dir)
	subprocess.run(['cmake', '-S', address, '-B', build_dir], check=True, stdout=subprocess.PIPE, universal_newlines=True)
	subprocess.run(['make', '-C', build_dir], check=True, stdout=subprocess.PIPE, universal_newlines=True)
	process = subprocess.run([os.path.join('.', build_dir, 'client', 'client')], check=True, stdout=subprocess.PIPE, universal_newlines=True)	
	output = process.stdout
	write_to_file(log_des, output)


def go(address, log_des):
	goadd = os.path.join('.', address, 'src', 'client')
	process = subprocess.run(['go', 'run', goadd], check=True, stdout=subprocess.PIPE, universal_newlines=True)
	output = process.stdout
	write_to_file(log_des, output)

# determining given clients kind
client_function = [None, None, None, None]
for i, client in enumerate(clients):
	for (dirpath, dirnames, filenames) in os.walk(client):
		p = [f for f in filenames if f[-3:] == '.py']
		if len(p) != 0:
			client_function[i] = python
			break
		p = [f for f in filenames if f[-5:] == '.java']
		if len(p) != 0:
			client_function[i] = java
			break
		p = [f for f in filenames if f[-4:] == '.cpp']
		if len(p) != 0:
			client_function[i] = cpp
			break
		p = [f for f in filenames if f[-3:] == '.go']
		if len(p) != 0:
			client_function[i] = go 
			break
	else:
		print('client not supported.')	
		exit()
		


# running clients
for i in range(4):
	log_des = os.path.join(base, 'client_' + str(logs_number[i]) + '.log')
	threading.Thread(target=client_function[i], args=(clients[i], log_des)).start()
	time.sleep(0.2)



# running server
log_des = os.path.join(base, 'server.log')
threading.Thread(target=server).start()




