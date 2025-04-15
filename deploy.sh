#!/bin/bash

# 服务器信息
SERVER="100.109.23.12"
PORT="22"
USER="lourd"
PASSWORD="Zyd1362848650!"
REPO_URL="git@github.com:kirohuji/ai-learning-backend.git"
TARGET_DIR="/home/lourd/ai-learning-backend"

# 使用 expect 来自动化 SSH 登录和命令执行
expect -c "
spawn ssh -p $PORT $USER@$SERVER
expect {
    \"*yes/no*\" { send \"yes\r\"; exp_continue }
    \"*password*\" { send \"$PASSWORD\r\" }
}
expect \"*$\"

# 检查目录是否存在并更新代码
send \"if [ -d \\\"$TARGET_DIR\\\" ]; then\r\"
send \"    cd $TARGET_DIR\r\"
send \"    git pull\r\"
send \"else\r\"
send \"    cd /home/lourd\r\"
send \"    git clone $REPO_URL\r\"
send \"    cd $TARGET_DIR\r\"
send \"fi\r\"

# 停止并移除旧的容器
send \"cd $TARGET_DIR\r\"
send \"docker-compose down\r\"

# 重新构建和启动服务
send \"docker-compose up -d --build\r\"

# 等待命令执行完成
expect \"*$\"
send \"exit\r\"
expect eof
"

echo "部署完成！" 