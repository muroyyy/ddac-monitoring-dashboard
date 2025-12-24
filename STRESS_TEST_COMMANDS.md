# EC2 Stress Testing Commands

## CPU Stress Test

### Using `stress` tool (recommended)
```bash
# Install stress tool
sudo yum install stress -y  # Amazon Linux/RHEL
# OR
sudo apt-get install stress -y  # Ubuntu/Debian

# Stress test CPU (all cores for 60 seconds)
stress --cpu $(nproc) --timeout 60s

# Stress test with specific number of cores
stress --cpu 2 --timeout 120s
```

### Using `dd` command (no installation needed)
```bash
# Single core stress
dd if=/dev/zero of=/dev/null &

# Multiple cores (run multiple times)
for i in {1..4}; do dd if=/dev/zero of=/dev/null & done

# Stop all dd processes
killall dd
```

### Using `yes` command (lightweight)
```bash
# Stress single core
yes > /dev/null &

# Stress multiple cores
for i in {1..4}; do yes > /dev/null & done

# Stop all yes processes
killall yes
```

## Memory Stress Test

### Using `stress` tool
```bash
# Allocate 512MB memory for 60 seconds
stress --vm 1 --vm-bytes 512M --timeout 60s

# Allocate 1GB memory
stress --vm 2 --vm-bytes 512M --timeout 120s
```

### Using `stress-ng` (advanced)
```bash
# Install stress-ng
sudo yum install stress-ng -y

# Memory stress test
stress-ng --vm 2 --vm-bytes 75% --timeout 60s
```

## Disk I/O Stress Test

### Using `dd` command
```bash
# Write test (creates 1GB file)
dd if=/dev/zero of=/tmp/testfile bs=1M count=1024

# Read test
dd if=/tmp/testfile of=/dev/null bs=1M

# Clean up
rm /tmp/testfile
```

### Using `stress` tool
```bash
# Disk I/O stress
stress --io 4 --timeout 60s
```

## Combined Stress Test

```bash
# CPU + Memory + Disk simultaneously
stress --cpu 2 --vm 1 --vm-bytes 512M --io 2 --timeout 120s
```

## Monitoring During Stress Test

### Watch real-time metrics
```bash
# CPU and Memory
top

# Detailed system stats
htop  # Install: sudo yum install htop -y

# Disk I/O
iostat -x 1

# All metrics
vmstat 1
```

## Important Notes

1. **Dashboard Refresh**: Your dashboard updates every 30 seconds, so wait a bit to see changes
2. **CloudWatch Delay**: CloudWatch metrics have ~1-5 minute delay
3. **Safety**: Start with short durations (30-60s) to avoid overloading
4. **Cleanup**: Always stop stress tests when done: `killall stress` or `killall dd`
5. **CloudWatch Agent**: Ensure CloudWatch Agent is installed and running for memory/disk metrics

## Quick Test Sequence

```bash
# 1. Start stress test
stress --cpu 2 --vm 1 --vm-bytes 256M --timeout 180s

# 2. In another terminal, monitor
watch -n 1 'top -bn1 | head -20'

# 3. Check your dashboard after 30-60 seconds
```
